import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  GetMaintenanceWindowExecutionTaskInvocationCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMaintenanceWindowExecutionTaskInvocation: AppBlock = {
  name: "Get Maintenance Window Execution Task Invocation",
  description: `Retrieves information about a specific task running on a specific target.`,
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
            "The ID of the maintenance window execution for which the task is a part.",
          type: "string",
          required: true,
        },
        TaskId: {
          name: "Task Id",
          description:
            "The ID of the specific task in the maintenance window task that should be retrieved.",
          type: "string",
          required: true,
        },
        InvocationId: {
          name: "Invocation Id",
          description: "The invocation ID to retrieve.",
          type: "string",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMaintenanceWindowExecutionTaskInvocationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Maintenance Window Execution Task Invocation Result",
      description:
        "Result from GetMaintenanceWindowExecutionTaskInvocation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowExecutionId: {
            type: "string",
            description: "The maintenance window execution ID.",
          },
          TaskExecutionId: {
            type: "string",
            description: "The task execution ID.",
          },
          InvocationId: {
            type: "string",
            description: "The invocation ID.",
          },
          ExecutionId: {
            type: "string",
            description: "The execution ID.",
          },
          TaskType: {
            type: "string",
            description: "Retrieves the task type for a maintenance window.",
          },
          Parameters: {
            type: "string",
            description: "The parameters used at the time that the task ran.",
          },
          Status: {
            type: "string",
            description: "The task status for an invocation.",
          },
          StatusDetails: {
            type: "string",
            description: "The details explaining the status.",
          },
          StartTime: {
            type: "string",
            description:
              "The time that the task started running on the target.",
          },
          EndTime: {
            type: "string",
            description:
              "The time that the task finished running on the target.",
          },
          OwnerInformation: {
            type: "string",
            description:
              "User-provided value to be included in any Amazon CloudWatch Events or Amazon EventBridge events raised while running tasks for these targets in this maintenance window.",
          },
          WindowTargetId: {
            type: "string",
            description: "The maintenance window target ID.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getMaintenanceWindowExecutionTaskInvocation;
