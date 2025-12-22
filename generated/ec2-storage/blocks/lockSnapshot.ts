import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, LockSnapshotCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const lockSnapshot: AppBlock = {
  name: "Lock Snapshot",
  description: `Locks an Amazon EBS snapshot in either governance or compliance mode to protect it against accidental or malicious deletions for a specific duration.`,
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
        SnapshotId: {
          name: "Snapshot Id",
          description: "The ID of the snapshot to lock.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        LockMode: {
          name: "Lock Mode",
          description: "The mode in which to lock the snapshot.",
          type: "string",
          required: true,
        },
        CoolOffPeriod: {
          name: "Cool Off Period",
          description:
            "The cooling-off period during which you can unlock the snapshot or modify the lock settings after locking the snapshot in compliance mode, in hours.",
          type: "number",
          required: false,
        },
        LockDuration: {
          name: "Lock Duration",
          description:
            "The period of time for which to lock the snapshot, in days.",
          type: "number",
          required: false,
        },
        ExpirationDate: {
          name: "Expiration Date",
          description:
            "The date and time at which the snapshot lock is to automatically expire, in the UTC time zone (YYYY-MM-DDThh:mm:ss.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new LockSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Lock Snapshot Result",
      description: "Result from LockSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SnapshotId: {
            type: "string",
            description: "The ID of the snapshot",
          },
          LockState: {
            type: "string",
            description: "The state of the snapshot lock.",
          },
          LockDuration: {
            type: "number",
            description:
              "The period of time for which the snapshot is locked, in days.",
          },
          CoolOffPeriod: {
            type: "number",
            description: "The compliance mode cooling-off period, in hours.",
          },
          CoolOffPeriodExpiresOn: {
            type: "string",
            description:
              "The date and time at which the compliance mode cooling-off period expires, in the UTC time zone (YYYY-MM-DDThh:mm:ss.",
          },
          LockCreatedOn: {
            type: "string",
            description:
              "The date and time at which the snapshot was locked, in the UTC time zone (YYYY-MM-DDThh:mm:ss.",
          },
          LockExpiresOn: {
            type: "string",
            description:
              "The date and time at which the lock will expire, in the UTC time zone (YYYY-MM-DDThh:mm:ss.",
          },
          LockDurationStartTime: {
            type: "string",
            description:
              "The date and time at which the lock duration started, in the UTC time zone (YYYY-MM-DDThh:mm:ss.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default lockSnapshot;
