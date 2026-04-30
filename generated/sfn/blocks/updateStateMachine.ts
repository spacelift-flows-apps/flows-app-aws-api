import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, UpdateStateMachineCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateStateMachine: AppBlock = {
  name: "Update State Machine",
  description: `Updates an existing state machine by modifying its definition, roleArn, loggingConfiguration, or EncryptionConfiguration.`,
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
        stateMachineArn: {
          name: "state Machine Arn",
          description: "The Amazon Resource Name (ARN) of the state machine.",
          type: "string",
          required: true,
        },
        definition: {
          name: "definition",
          description:
            "The Amazon States Language definition of the state machine.",
          type: "string",
          required: false,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role of the state machine.",
          type: "string",
          required: false,
        },
        loggingConfiguration: {
          name: "logging Configuration",
          description:
            "Use the LoggingConfiguration data type to set CloudWatch Logs options.",
          type: {
            type: "object",
            properties: {
              level: {
                type: "string",
              },
              includeExecutionData: {
                type: "boolean",
              },
              destinations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cloudWatchLogsLogGroup: {
                      type: "object",
                      properties: {
                        logGroupArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        tracingConfiguration: {
          name: "tracing Configuration",
          description: "Selects whether X-Ray tracing is enabled.",
          type: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        publish: {
          name: "publish",
          description:
            "Specifies whether the state machine version is published.",
          type: "boolean",
          required: false,
        },
        versionDescription: {
          name: "version Description",
          description:
            "An optional description of the state machine version to publish.",
          type: "string",
          required: false,
        },
        encryptionConfiguration: {
          name: "encryption Configuration",
          description: "Settings to configure server-side encryption.",
          type: {
            type: "object",
            properties: {
              kmsKeyId: {
                type: "string",
              },
              kmsDataKeyReusePeriodSeconds: {
                type: "number",
              },
              type: {
                type: "string",
              },
            },
            required: ["type"],
            additionalProperties: false,
          },
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateStateMachineCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update State Machine Result",
      description: "Result from UpdateStateMachine operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          updateDate: {
            type: "string",
            description: "The date and time the state machine was updated.",
          },
          revisionId: {
            type: "string",
            description:
              "The revision identifier for the updated state machine.",
          },
          stateMachineVersionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the published state machine version.",
          },
        },
        required: ["updateDate"],
      },
    },
  },
};

export default updateStateMachine;
