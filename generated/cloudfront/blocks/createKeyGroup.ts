import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateKeyGroupCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createKeyGroup: AppBlock = {
  name: "Create Key Group",
  description: `Creates a key group that you can use with CloudFront signed URLs and signed cookies.`,
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
        KeyGroupConfig: {
          name: "Key Group Config",
          description: "A key group configuration.",
          type: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Items: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Comment: {
                type: "string",
              },
            },
            required: ["Name", "Items"],
            additionalProperties: false,
          },
          required: true,
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

        const command = new CreateKeyGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Key Group Result",
      description: "Result from CreateKeyGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KeyGroup: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              KeyGroupConfig: {
                type: "object",
                properties: {
                  Name: {
                    type: "string",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  Comment: {
                    type: "string",
                  },
                },
                required: ["Name", "Items"],
                additionalProperties: false,
              },
            },
            required: ["Id", "LastModifiedTime", "KeyGroupConfig"],
            additionalProperties: false,
            description: "The key group that was just created.",
          },
          Location: {
            type: "string",
            description: "The URL of the key group.",
          },
          ETag: {
            type: "string",
            description: "The identifier for this version of the key group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createKeyGroup;
