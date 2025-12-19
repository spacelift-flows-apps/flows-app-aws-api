import { AppBlock, events } from "@slflows/sdk/v1";
import { WAFClient, PutLoggingConfigurationCommand } from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putLoggingConfiguration: AppBlock = {
  name: "Put Logging Configuration",
  description: `This is AWS WAF Classic documentation.`,
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
        LoggingConfiguration: {
          name: "Logging Configuration",
          description:
            "The Amazon Kinesis Data Firehose that contains the inspected traffic information, the redacted fields details, and the Amazon Resource Name (ARN) of the web ACL to monitor.",
          type: {
            type: "object",
            properties: {
              ResourceArn: {
                type: "string",
              },
              LogDestinationConfigs: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              RedactedFields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                    },
                    Data: {
                      type: "string",
                    },
                  },
                  required: ["Type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ResourceArn", "LogDestinationConfigs"],
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

        const client = new WAFClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutLoggingConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Logging Configuration Result",
      description: "Result from PutLoggingConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LoggingConfiguration: {
            type: "object",
            properties: {
              ResourceArn: {
                type: "string",
              },
              LogDestinationConfigs: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              RedactedFields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Type: {
                      type: "string",
                    },
                    Data: {
                      type: "string",
                    },
                  },
                  required: ["Type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ResourceArn", "LogDestinationConfigs"],
            additionalProperties: false,
            description:
              "The LoggingConfiguration that you submitted in the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putLoggingConfiguration;
