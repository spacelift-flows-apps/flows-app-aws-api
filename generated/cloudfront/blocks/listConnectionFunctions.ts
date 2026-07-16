import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListConnectionFunctionsCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listConnectionFunctions: AppBlock = {
  name: "List Connection Functions",
  description: `Lists connection functions.`,
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
        Marker: {
          name: "Marker",
          description:
            "Use this field when paginating results to indicate where to begin in your list.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of connection functions that you want returned in the response.",
          type: "number",
          required: false,
        },
        Stage: {
          name: "Stage",
          description: "The connection function's stage.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        let credentials = {
          accessKeyId: input.app.config.accessKeyId,
          secretAccessKey: input.app.config.secretAccessKey,
          sessionToken: input.app.config.sessionToken,
        };

        // Determine credentials to use
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: credentials,
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
        }

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListConnectionFunctionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Connection Functions Result",
      description: "Result from ListConnectionFunctions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description: "Indicates the next page of connection functions.",
          },
          ConnectionFunctions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Id: {
                  type: "string",
                },
                ConnectionFunctionConfig: {
                  type: "object",
                  properties: {
                    Comment: {
                      type: "string",
                    },
                    Runtime: {
                      type: "string",
                    },
                    KeyValueStoreAssociations: {
                      type: "object",
                      properties: {
                        Quantity: {
                          type: "number",
                        },
                        Items: {
                          type: "array",
                          items: {},
                        },
                      },
                      required: ["Quantity"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Comment", "Runtime"],
                  additionalProperties: false,
                },
                ConnectionFunctionArn: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                Stage: {
                  type: "string",
                },
                CreatedTime: {
                  type: "string",
                },
                LastModifiedTime: {
                  type: "string",
                },
              },
              required: [
                "Name",
                "Id",
                "ConnectionFunctionConfig",
                "ConnectionFunctionArn",
                "Status",
                "Stage",
                "CreatedTime",
                "LastModifiedTime",
              ],
              additionalProperties: false,
            },
            description: "A list of connection functions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listConnectionFunctions;
