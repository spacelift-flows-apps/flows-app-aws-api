import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyInstanceEventStartTimeCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyInstanceEventStartTime: AppBlock = {
  name: "Modify Instance Event Start Time",
  description: `Modifies the start time for a scheduled Amazon EC2 instance event.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance with the scheduled event.",
          type: "string",
          required: true,
        },
        InstanceEventId: {
          name: "Instance Event Id",
          description:
            "The ID of the event whose date and time you are modifying.",
          type: "string",
          required: true,
        },
        NotBefore: {
          name: "Not Before",
          description: "The new date and time when the event will take place.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyInstanceEventStartTimeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Instance Event Start Time Result",
      description: "Result from ModifyInstanceEventStartTime operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Event: {
            type: "object",
            properties: {
              InstanceEventId: {
                type: "string",
              },
              Code: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              NotAfter: {
                type: "string",
              },
              NotBefore: {
                type: "string",
              },
              NotBeforeDeadline: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the event.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyInstanceEventStartTime;
