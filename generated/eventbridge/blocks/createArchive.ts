import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  CreateArchiveCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createArchive: AppBlock = {
  name: "Create Archive",
  description: `Creates an archive of events with the specified settings.`,
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
          description: "The name for the archive to create.",
          type: "string",
          required: true,
        },
        EventSourceArn: {
          name: "Event Source Arn",
          description:
            "The ARN of the event bus that sends events to the archive.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the archive.",
          type: "string",
          required: false,
        },
        EventPattern: {
          name: "Event Pattern",
          description:
            "An event pattern to use to filter events sent to the archive.",
          type: "string",
          required: false,
        },
        RetentionDays: {
          name: "Retention Days",
          description: "The number of days to retain events for.",
          type: "number",
          required: false,
        },
        KmsKeyIdentifier: {
          name: "Kms Key Identifier",
          description:
            "The identifier of the KMS customer managed key for EventBridge to use, if you choose to use a customer managed key to encrypt this archive.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateArchiveCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Archive Result",
      description: "Result from CreateArchive operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ArchiveArn: {
            type: "string",
            description: "The ARN of the archive that was created.",
          },
          State: {
            type: "string",
            description: "The state of the archive that was created.",
          },
          StateReason: {
            type: "string",
            description: "The reason that the archive is in the state.",
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

export default createArchive;
