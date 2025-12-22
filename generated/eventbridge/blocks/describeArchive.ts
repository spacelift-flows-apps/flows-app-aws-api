import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  DescribeArchiveCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeArchive: AppBlock = {
  name: "Describe Archive",
  description: `Retrieves details about an archive.`,
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
        ArchiveName: {
          name: "Archive Name",
          description: "The name of the archive to retrieve.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeArchiveCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Archive Result",
      description: "Result from DescribeArchive operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ArchiveArn: {
            type: "string",
            description: "The ARN of the archive.",
          },
          ArchiveName: {
            type: "string",
            description: "The name of the archive.",
          },
          EventSourceArn: {
            type: "string",
            description:
              "The ARN of the event source associated with the archive.",
          },
          Description: {
            type: "string",
            description: "The description of the archive.",
          },
          EventPattern: {
            type: "string",
            description:
              "The event pattern used to filter events sent to the archive.",
          },
          State: {
            type: "string",
            description: "The state of the archive.",
          },
          StateReason: {
            type: "string",
            description: "The reason that the archive is in the state.",
          },
          KmsKeyIdentifier: {
            type: "string",
            description:
              "The identifier of the KMS customer managed key for EventBridge to use to encrypt this archive, if one has been specified.",
          },
          RetentionDays: {
            type: "number",
            description:
              "The number of days to retain events for in the archive.",
          },
          SizeBytes: {
            type: "number",
            description: "The size of the archive in bytes.",
          },
          EventCount: {
            type: "number",
            description: "The number of events in the archive.",
          },
          CreationTime: {
            type: "string",
            description: "The time at which the archive was created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeArchive;
