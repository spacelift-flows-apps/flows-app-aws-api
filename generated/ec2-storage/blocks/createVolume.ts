import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateVolumeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createVolume: AppBlock = {
  name: "Create Volume",
  description: `Creates an EBS volume that can be attached to an instance in the same Availability Zone.`,
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
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The ID of the Availability Zone in which to create the volume.",
          type: "string",
          required: true,
        },
        Encrypted: {
          name: "Encrypted",
          description: "Indicates whether the volume should be encrypted.",
          type: "boolean",
          required: false,
        },
        Iops: {
          name: "Iops",
          description: "The number of I/O operations per second (IOPS).",
          type: "number",
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The identifier of the KMS key to use for Amazon EBS encryption.",
          type: "string",
          required: false,
        },
        OutpostArn: {
          name: "Outpost Arn",
          description:
            "The Amazon Resource Name (ARN) of the Outpost on which to create the volume.",
          type: "string",
          required: false,
        },
        Size: {
          name: "Size",
          description: "The size of the volume, in GiBs.",
          type: "number",
          required: false,
        },
        SnapshotId: {
          name: "Snapshot Id",
          description: "The snapshot from which to create the volume.",
          type: "string",
          required: false,
        },
        VolumeType: {
          name: "Volume Type",
          description: "The volume type.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the volume during creation.",
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
        MultiAttachEnabled: {
          name: "Multi Attach Enabled",
          description: "Indicates whether to enable Amazon EBS Multi-Attach.",
          type: "boolean",
          required: false,
        },
        Throughput: {
          name: "Throughput",
          description:
            "The throughput to provision for a volume, with a maximum of 1,000 MiB/s.",
          type: "number",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        VolumeInitializationRate: {
          name: "Volume Initialization Rate",
          description:
            "Specifies the Amazon EBS Provisioned Rate for Volume Initialization (volume initialization rate), in MiB/s, at which to download the snapshot blocks from Amazon S3 to the volume.",
          type: "number",
          required: false,
        },
        Operator: {
          name: "Operator",
          description: "Reserved for internal use.",
          type: {
            type: "object",
            properties: {
              Principal: {
                type: "string",
              },
            },
            additionalProperties: false,
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateVolumeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Volume Result",
      description: "Result from CreateVolume operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OutpostArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the Outpost.",
          },
          Iops: {
            type: "number",
            description: "The number of I/O operations per second (IOPS).",
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
            description: "Any tags assigned to the volume.",
          },
          VolumeType: {
            type: "string",
            description: "The volume type.",
          },
          FastRestored: {
            type: "boolean",
            description: "This parameter is not returned by CreateVolume.",
          },
          MultiAttachEnabled: {
            type: "boolean",
            description:
              "Indicates whether Amazon EBS Multi-Attach is enabled.",
          },
          Throughput: {
            type: "number",
            description: "The throughput that the volume supports, in MiB/s.",
          },
          SseType: {
            type: "string",
            description: "This parameter is not returned by CreateVolume.",
          },
          Operator: {
            type: "object",
            properties: {
              Managed: {
                type: "boolean",
              },
              Principal: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The service provider that manages the volume.",
          },
          VolumeInitializationRate: {
            type: "number",
            description:
              "The Amazon EBS Provisioned Rate for Volume Initialization (volume initialization rate) specified for the volume during creation, in MiB/s.",
          },
          VolumeId: {
            type: "string",
            description: "The ID of the volume.",
          },
          Size: {
            type: "number",
            description: "The size of the volume, in GiBs.",
          },
          SnapshotId: {
            type: "string",
            description:
              "The snapshot from which the volume was created, if applicable.",
          },
          AvailabilityZone: {
            type: "string",
            description: "The Availability Zone for the volume.",
          },
          State: {
            type: "string",
            description: "The volume state.",
          },
          CreateTime: {
            type: "string",
            description: "The time stamp when volume creation was initiated.",
          },
          Attachments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DeleteOnTermination: {
                  type: "boolean",
                },
                AssociatedResource: {
                  type: "string",
                },
                InstanceOwningService: {
                  type: "string",
                },
                VolumeId: {
                  type: "string",
                },
                InstanceId: {
                  type: "string",
                },
                Device: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                AttachTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "This parameter is not returned by CreateVolume.",
          },
          Encrypted: {
            type: "boolean",
            description: "Indicates whether the volume is encrypted.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the KMS key that was used to protect the volume encryption key for the volume.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createVolume;
