import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateMaintenanceWindowCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createMaintenanceWindow: AppBlock = {
  name: "Create Maintenance Window",
  description: `Creates a new maintenance window.`,
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
        Name: {
          name: "Name",
          description: "The name of the maintenance window.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "An optional description for the maintenance window.",
          type: "string",
          required: false,
        },
        StartDate: {
          name: "Start Date",
          description:
            "The date and time, in ISO-8601 Extended format, for when you want the maintenance window to become active.",
          type: "string",
          required: false,
        },
        EndDate: {
          name: "End Date",
          description:
            "The date and time, in ISO-8601 Extended format, for when you want the maintenance window to become inactive.",
          type: "string",
          required: false,
        },
        Schedule: {
          name: "Schedule",
          description:
            "The schedule of the maintenance window in the form of a cron or rate expression.",
          type: "string",
          required: true,
        },
        ScheduleTimezone: {
          name: "Schedule Timezone",
          description:
            "The time zone that the scheduled maintenance window executions are based on, in Internet Assigned Numbers Authority (IANA) format.",
          type: "string",
          required: false,
        },
        ScheduleOffset: {
          name: "Schedule Offset",
          description:
            "The number of days to wait after the date and time specified by a cron expression before running the maintenance window.",
          type: "number",
          required: false,
        },
        Duration: {
          name: "Duration",
          description: "The duration of the maintenance window in hours.",
          type: "number",
          required: true,
        },
        Cutoff: {
          name: "Cutoff",
          description:
            "The number of hours before the end of the maintenance window that Amazon Web Services Systems Manager stops scheduling new tasks for execution.",
          type: "number",
          required: true,
        },
        AllowUnassociatedTargets: {
          name: "Allow Unassociated Targets",
          description:
            "Enables a maintenance window task to run on managed nodes, even if you haven't registered those nodes as targets.",
          type: "boolean",
          required: true,
        },
        ClientToken: {
          name: "Client Token",
          description: "User-provided idempotency token.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Optional metadata that you assign to a resource.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateMaintenanceWindowCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Maintenance Window Result",
      description: "Result from CreateMaintenanceWindow operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowId: {
            type: "string",
            description: "The ID of the created maintenance window.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createMaintenanceWindow;
