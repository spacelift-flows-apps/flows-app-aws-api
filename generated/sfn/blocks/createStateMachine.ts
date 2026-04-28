import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, CreateStateMachineCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createStateMachine: AppBlock = {
  name: "Create State Machine",
  description: `Creates a state machine.`,
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
        name: {
          name: "name",
          description: "The name of the state machine.",
          type: "string",
          required: true,
        },
        definition: {
          name: "definition",
          description:
            "The Amazon States Language definition of the state machine.",
          type: "string",
          required: true,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role to use for this state machine.",
          type: "string",
          required: true,
        },
        type: {
          name: "type",
          description:
            "Determines whether a Standard or Express state machine is created.",
          type: "string",
          required: false,
        },
        loggingConfiguration: {
          name: "logging Configuration",
          description:
            "Defines what execution history events are logged and where they are logged.",
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
        tags: {
          name: "tags",
          description: "Tags to be added when creating a state machine.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                },
                value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
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
            "Set to true to publish the first version of the state machine during creation.",
          type: "boolean",
          required: false,
        },
        versionDescription: {
          name: "version Description",
          description: "Sets description about the state machine version.",
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

        const command = new CreateStateMachineCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create State Machine Result",
      description: "Result from CreateStateMachine operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stateMachineArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the created state machine.",
          },
          creationDate: {
            type: "string",
            description: "The date the state machine is created.",
          },
          stateMachineVersionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the created state machine version.",
          },
        },
        required: ["stateMachineArn", "creationDate"],
      },
    },
  },
};

export default createStateMachine;
