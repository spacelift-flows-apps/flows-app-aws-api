import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  PutScheduledUpdateGroupActionCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const putScheduledUpdateGroupAction: AppBlock = {
  name: "Put Scheduled Update Group Action",
  description: `Creates or updates a scheduled scaling action for an Auto Scaling group.`,
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
        AutoScalingGroupName: {
          name: "Auto Scaling Group Name",
          description: "The name of the Auto Scaling group.",
          type: "string",
          required: true,
        },
        ScheduledActionName: {
          name: "Scheduled Action Name",
          description: "The name of this scaling action.",
          type: "string",
          required: true,
        },
        Time: {
          name: "Time",
          description: "This property is no longer used.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            'The date and time for this action to start, in YYYY-MM-DDThh:mm:ssZ format in UTC/GMT only and in quotes (for example, "2021-06-01T00:00:00Z").',
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "The date and time for the recurring schedule to end, in UTC.",
          type: "string",
          required: false,
        },
        Recurrence: {
          name: "Recurrence",
          description: "The recurring schedule for this action.",
          type: "string",
          required: false,
        },
        MinSize: {
          name: "Min Size",
          description: "The minimum size of the Auto Scaling group.",
          type: "number",
          required: false,
        },
        MaxSize: {
          name: "Max Size",
          description: "The maximum size of the Auto Scaling group.",
          type: "number",
          required: false,
        },
        DesiredCapacity: {
          name: "Desired Capacity",
          description:
            "The desired capacity is the initial capacity of the Auto Scaling group after the scheduled action runs and the capacity it attempts to maintain.",
          type: "number",
          required: false,
        },
        TimeZone: {
          name: "Time Zone",
          description: "Specifies the time zone for a cron expression.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutScheduledUpdateGroupActionCommand(
          convertTimestamps(
            commandInput,
            new Set(["Time", "StartTime", "EndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Scheduled Update Group Action Result",
      description: "Result from PutScheduledUpdateGroupAction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putScheduledUpdateGroupAction;
