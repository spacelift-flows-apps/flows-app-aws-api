import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, DescribeStateMachineCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStateMachine: AppBlock = {
  name: "Describe State Machine",
  description: `Provides information about a state machine's definition, its IAM role Amazon Resource Name (ARN), and configuration.`,
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
          description:
            "The Amazon Resource Name (ARN) of the state machine for which you want the information.",
          type: "string",
          required: true,
        },
        includedData: {
          name: "included Data",
          description:
            "If your state machine definition is encrypted with a KMS key, callers must have kms:Decrypt permission to decrypt the definition.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStateMachineCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe State Machine Result",
      description: "Result from DescribeStateMachine operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stateMachineArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the state machine.",
          },
          name: {
            type: "string",
            description: "The name of the state machine.",
          },
          status: {
            type: "string",
            description: "The current status of the state machine.",
          },
          definition: {
            type: "string",
            description:
              "The Amazon States Language definition of the state machine.",
          },
          roleArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the IAM role used when creating this state machine.",
          },
          type: {
            type: "string",
            description: "The type of the state machine (STANDARD or EXPRESS).",
          },
          creationDate: {
            type: "string",
            description: "The date the state machine is created.",
          },
          loggingConfiguration: {
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
            description:
              "The LoggingConfiguration data type is used to set CloudWatch Logs options.",
          },
          tracingConfiguration: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Selects whether X-Ray tracing is enabled.",
          },
          label: {
            type: "string",
            description:
              "A user-defined or an auto-generated string that identifies a Map state.",
          },
          revisionId: {
            type: "string",
            description: "The revision identifier for the state machine.",
          },
          description: {
            type: "string",
            description: "The description of the state machine version.",
          },
          encryptionConfiguration: {
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
            description: "Settings to configure server-side encryption.",
          },
          variableReferences: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
            description:
              "A map of state name to a list of variables referenced by that state.",
          },
        },
        required: [
          "stateMachineArn",
          "name",
          "definition",
          "roleArn",
          "type",
          "creationDate",
        ],
      },
    },
  },
};

export default describeStateMachine;
