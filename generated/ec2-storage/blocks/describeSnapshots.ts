import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeSnapshotsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSnapshots: AppBlock = {
  name: "Describe Snapshots",
  description: `Describes the specified EBS snapshots available to you or all of the EBS snapshots available to you.`,
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
          required: false,
        },
        OwnerIds: {
          name: "Owner Ids",
          description:
            "Scopes the results to snapshots with the specified owners.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RestorableByUserIds: {
          name: "Restorable By User Ids",
          description:
            "The IDs of the Amazon Web Services accounts that can create volumes from the snapshot.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SnapshotIds: {
          name: "Snapshot Ids",
          description: "The snapshot IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "The filters.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeSnapshotsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Snapshots Result",
      description: "Result from DescribeSnapshots operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Snapshots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OwnerAlias: {
                  type: "string",
                },
                OutpostArn: {
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
                StorageTier: {
                  type: "string",
                },
                RestoreExpiryTime: {
                  type: "string",
                },
                SseType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                TransferType: {
                  type: "string",
                },
                CompletionDurationMinutes: {
                  type: "number",
                },
                CompletionTime: {
                  type: "string",
                },
                FullSnapshotSizeInBytes: {
                  type: "number",
                },
                SnapshotId: {
                  type: "string",
                },
                VolumeId: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                StateMessage: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                Progress: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                VolumeSize: {
                  type: "number",
                },
                Encrypted: {
                  type: "boolean",
                },
                KmsKeyId: {
                  type: "string",
                },
                DataEncryptionKeyId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the snapshots.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSnapshots;
