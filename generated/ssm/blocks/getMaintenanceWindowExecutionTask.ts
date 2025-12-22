import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  GetMaintenanceWindowExecutionTaskCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMaintenanceWindowExecutionTask: AppBlock = {
  name: "Get Maintenance Window Execution Task",
  description: `Retrieves the details about a specific task run as part of a maintenance window execution.`,
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
        WindowExecutionId: {
          name: "Window Execution Id",
          description:
            "The ID of the maintenance window execution that includes the task.",
          type: "string",
          required: true,
        },
        TaskId: {
          name: "Task Id",
          description:
            "The ID of the specific task execution in the maintenance window task that should be retrieved.",
          type: "string",
          required: true,
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
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMaintenanceWindowExecutionTaskCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Maintenance Window Execution Task Result",
      description: "Result from GetMaintenanceWindowExecutionTask operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowExecutionId: {
            type: "string",
            description:
              "The ID of the maintenance window execution that includes the task.",
          },
          TaskExecutionId: {
            type: "string",
            description:
              "The ID of the specific task execution in the maintenance window task that was retrieved.",
          },
          TaskArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the task that ran.",
          },
          ServiceRole: {
            type: "string",
            description: "The role that was assumed when running the task.",
          },
          Type: {
            type: "string",
            description: "The type of task that was run.",
          },
          TaskParameters: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: {
                type: "object",
              },
            },
            description: "The parameters passed to the task when it was run.",
          },
          Priority: {
            type: "number",
            description: "The priority of the task.",
          },
          MaxConcurrency: {
            type: "string",
            description:
              "The defined maximum number of task executions that could be run in parallel.",
          },
          MaxErrors: {
            type: "string",
            description:
              "The defined maximum number of task execution errors allowed before scheduling of the task execution would have been stopped.",
          },
          Status: {
            type: "string",
            description: "The status of the task.",
          },
          StatusDetails: {
            type: "string",
            description: "The details explaining the status.",
          },
          StartTime: {
            type: "string",
            description: "The time the task execution started.",
          },
          EndTime: {
            type: "string",
            description: "The time the task execution completed.",
          },
          AlarmConfiguration: {
            type: "object",
            properties: {
              IgnorePollAlarmFailure: {
                type: "boolean",
              },
              Alarms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
              },
            },
            required: ["Alarms"],
            additionalProperties: false,
            description:
              "The details for the CloudWatch alarm you applied to your maintenance window task.",
          },
          TriggeredAlarms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
              },
              required: ["Name", "State"],
              additionalProperties: false,
            },
            description:
              "The CloudWatch alarms that were invoked by the maintenance window task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMaintenanceWindowExecutionTask;
