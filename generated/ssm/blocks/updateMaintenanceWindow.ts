import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, UpdateMaintenanceWindowCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateMaintenanceWindow: AppBlock = {
  name: "Update Maintenance Window",
  description: `Updates an existing maintenance window.`,
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
        WindowId: {
          name: "Window Id",
          description: "The ID of the maintenance window to update.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The name of the maintenance window.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "An optional description for the update request.",
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
          required: false,
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
          required: false,
        },
        Cutoff: {
          name: "Cutoff",
          description:
            "The number of hours before the end of the maintenance window that Amazon Web Services Systems Manager stops scheduling new tasks for execution.",
          type: "number",
          required: false,
        },
        AllowUnassociatedTargets: {
          name: "Allow Unassociated Targets",
          description:
            "Whether targets must be registered with the maintenance window before tasks can be defined for those targets.",
          type: "boolean",
          required: false,
        },
        Enabled: {
          name: "Enabled",
          description: "Whether the maintenance window is enabled.",
          type: "boolean",
          required: false,
        },
        Replace: {
          name: "Replace",
          description:
            "If True, then all fields that are required by the CreateMaintenanceWindow operation are also required for this API request.",
          type: "boolean",
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

        const command = new UpdateMaintenanceWindowCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Maintenance Window Result",
      description: "Result from UpdateMaintenanceWindow operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowId: {
            type: "string",
            description: "The ID of the created maintenance window.",
          },
          Name: {
            type: "string",
            description: "The name of the maintenance window.",
          },
          Description: {
            type: "string",
            description: "An optional description of the update.",
          },
          StartDate: {
            type: "string",
            description:
              "The date and time, in ISO-8601 Extended format, for when the maintenance window is scheduled to become active.",
          },
          EndDate: {
            type: "string",
            description:
              "The date and time, in ISO-8601 Extended format, for when the maintenance window is scheduled to become inactive.",
          },
          Schedule: {
            type: "string",
            description:
              "The schedule of the maintenance window in the form of a cron or rate expression.",
          },
          ScheduleTimezone: {
            type: "string",
            description:
              "The time zone that the scheduled maintenance window executions are based on, in Internet Assigned Numbers Authority (IANA) format.",
          },
          ScheduleOffset: {
            type: "number",
            description:
              "The number of days to wait to run a maintenance window after the scheduled cron expression date and time.",
          },
          Duration: {
            type: "number",
            description: "The duration of the maintenance window in hours.",
          },
          Cutoff: {
            type: "number",
            description:
              "The number of hours before the end of the maintenance window that Amazon Web Services Systems Manager stops scheduling new tasks for execution.",
          },
          AllowUnassociatedTargets: {
            type: "boolean",
            description:
              "Whether targets must be registered with the maintenance window before tasks can be defined for those targets.",
          },
          Enabled: {
            type: "boolean",
            description: "Whether the maintenance window is enabled.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateMaintenanceWindow;
