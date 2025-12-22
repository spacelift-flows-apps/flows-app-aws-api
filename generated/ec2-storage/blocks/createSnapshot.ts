import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateSnapshotCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createSnapshot: AppBlock = {
  name: "Create Snapshot",
  description: `Creates a snapshot of an EBS volume and stores it in Amazon S3.`,
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
        Description: {
          name: "Description",
          description: "A description for the snapshot.",
          type: "string",
          required: false,
        },
        OutpostArn: {
          name: "Outpost Arn",
          description: "Only supported for volumes on Outposts.",
          type: "string",
          required: false,
        },
        VolumeId: {
          name: "Volume Id",
          description: "The ID of the Amazon EBS volume.",
          type: "string",
          required: true,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the snapshot during creation.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Location: {
          name: "Location",
          description: "Only supported for volumes in Local Zones.",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
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

        const command = new CreateSnapshotCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Snapshot Result",
      description: "Result from CreateSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OwnerAlias: {
            type: "string",
            description:
              "The Amazon Web Services owner alias, from an Amazon-maintained list (amazon).",
          },
          OutpostArn: {
            type: "string",
            description:
              "The ARN of the Outpost on which the snapshot is stored.",
          },
          Tags: {
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
              additionalProperties: false,
            },
            description: "Any tags assigned to the snapshot.",
          },
          StorageTier: {
            type: "string",
            description: "The storage tier in which the snapshot is stored.",
          },
          RestoreExpiryTime: {
            type: "string",
            description:
              "Only for archived snapshots that are temporarily restored.",
          },
          SseType: {
            type: "string",
            description: "Reserved for future use.",
          },
          AvailabilityZone: {
            type: "string",
            description: "The Availability Zone or Local Zone of the snapshot.",
          },
          TransferType: {
            type: "string",
            description: "Only for snapshot copies.",
          },
          CompletionDurationMinutes: {
            type: "number",
            description:
              "Only for snapshot copies created with time-based snapshot copy operations.",
          },
          CompletionTime: {
            type: "string",
            description: "The time stamp when the snapshot was completed.",
          },
          FullSnapshotSizeInBytes: {
            type: "number",
            description: "The full size of the snapshot, in bytes.",
          },
          SnapshotId: {
            type: "string",
            description: "The ID of the snapshot.",
          },
          VolumeId: {
            type: "string",
            description:
              "The ID of the volume that was used to create the snapshot.",
          },
          State: {
            type: "string",
            description: "The snapshot state.",
          },
          StateMessage: {
            type: "string",
            description:
              "Encrypted Amazon EBS snapshots are copied asynchronously.",
          },
          StartTime: {
            type: "string",
            description: "The time stamp when the snapshot was initiated.",
          },
          Progress: {
            type: "string",
            description: "The progress of the snapshot, as a percentage.",
          },
          OwnerId: {
            type: "string",
            description:
              "The ID of the Amazon Web Services account that owns the EBS snapshot.",
          },
          Description: {
            type: "string",
            description: "The description for the snapshot.",
          },
          VolumeSize: {
            type: "number",
            description: "The size of the volume, in GiB.",
          },
          Encrypted: {
            type: "boolean",
            description: "Indicates whether the snapshot is encrypted.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the KMS key that was used to protect the volume encryption key for the parent volume.",
          },
          DataEncryptionKeyId: {
            type: "string",
            description: "The data encryption key identifier for the snapshot.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createSnapshot;
