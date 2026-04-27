import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  PutScheduledActionCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const putScheduledAction: AppBlock = {
  name: "Put Scheduled Action",
  description: `Creates or updates a scheduled action for an Application Auto Scaling scalable target.`,
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
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: "string",
          required: true,
        },
        Schedule: {
          name: "Schedule",
          description: "The schedule for this action.",
          type: "string",
          required: false,
        },
        Timezone: {
          name: "Timezone",
          description:
            "Specifies the time zone used when setting a scheduled action by using an at or cron expression.",
          type: "string",
          required: false,
        },
        ScheduledActionName: {
          name: "Scheduled Action Name",
          description: "The name of the scheduled action.",
          type: "string",
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description:
            "The identifier of the resource associated with the scheduled action.",
          type: "string",
          required: true,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description: "The scalable dimension.",
          type: "string",
          required: true,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The date and time for this scheduled action to start, in UTC.",
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
        ScalableTargetAction: {
          name: "Scalable Target Action",
          description: "The new minimum and maximum capacity.",
          type: {
            type: "object",
            properties: {
              MinCapacity: {
                type: "number",
              },
              MaxCapacity: {
                type: "number",
              },
            },
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

        const client = new ApplicationAutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutScheduledActionCommand(
          convertTimestamps(
            commandInput,
            new Set(["StartTime", "EndTime"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Scheduled Action Result",
      description: "Result from PutScheduledAction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default putScheduledAction;
