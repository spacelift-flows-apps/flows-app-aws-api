import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListRealtimeLogConfigsCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRealtimeLogConfigs: AppBlock = {
  name: "List Realtime Log Configs",
  description: `Gets a list of real-time log configurations.`,
  inputs: {
    default: {
      config: {
        region: {
          name: "Region",
          description: "AWS region for this operation",
          type: "string",
          required: true,
        },
        assumeRoleArn: {
          name: "Assume Role ARN",
          description:
            "Optional IAM role ARN to assume before executing this operation. If provided, the block will use STS to assume this role and use the temporary credentials.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of real-time log configurations that you want in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this field when paginating results to indicate where to begin in your list of real-time log configurations.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
            ...(input.app.config.endpoint && {
              endpoint: input.app.config.endpoint,
            }),
          });

          const assumeRoleCommand = new AssumeRoleCommand({
            RoleArn: assumeRoleArn,
            RoleSessionName: `flows-session-${Date.now()}`,
          });

          const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
          credentials = {
            accessKeyId: assumeRoleResponse.Credentials!.AccessKeyId!,
            secretAccessKey: assumeRoleResponse.Credentials!.SecretAccessKey!,
            sessionToken: assumeRoleResponse.Credentials!.SessionToken!,
          };
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListRealtimeLogConfigsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Realtime Log Configs Result",
      description: "Result from ListRealtimeLogConfigs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RealtimeLogConfigs: {
            type: "object",
            properties: {
              MaxItems: {
                type: "number",
              },
              Items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ARN: {
                      type: "string",
                    },
                    Name: {
                      type: "string",
                    },
                    SamplingRate: {
                      type: "number",
                    },
                    EndPoints: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Fields: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: [
                    "ARN",
                    "Name",
                    "SamplingRate",
                    "EndPoints",
                    "Fields",
                  ],
                  additionalProperties: false,
                },
              },
              IsTruncated: {
                type: "boolean",
              },
              Marker: {
                type: "string",
              },
              NextMarker: {
                type: "string",
              },
            },
            required: ["MaxItems", "IsTruncated", "Marker"],
            additionalProperties: false,
            description: "A list of real-time log configurations.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listRealtimeLogConfigs;
