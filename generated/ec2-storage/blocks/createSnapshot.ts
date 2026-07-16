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
                  enum: [
                    "capacity-reservation",
                    "client-vpn-endpoint",
                    "customer-gateway",
                    "carrier-gateway",
                    "coip-pool",
                    "declarative-policies-report",
                    "dedicated-host",
                    "dhcp-options",
                    "egress-only-internet-gateway",
                    "elastic-ip",
                    "elastic-gpu",
                    "export-image-task",
                    "export-instance-task",
                    "fleet",
                    "fpga-image",
                    "host-reservation",
                    "image",
                    "image-usage-report",
                    "import-image-task",
                    "import-snapshot-task",
                    "instance",
                    "instance-event-window",
                    "internet-gateway",
                    "ipam",
                    "ipam-pool",
                    "ipam-scope",
                    "ipv4pool-ec2",
                    "ipv6pool-ec2",
                    "key-pair",
                    "launch-template",
                    "local-gateway",
                    "local-gateway-route-table",
                    "local-gateway-virtual-interface",
                    "local-gateway-virtual-interface-group",
                    "local-gateway-route-table-vpc-association",
                    "local-gateway-route-table-virtual-interface-group-association",
                    "natgateway",
                    "network-acl",
                    "network-interface",
                    "network-insights-analysis",
                    "network-insights-path",
                    "network-insights-access-scope",
                    "network-insights-access-scope-analysis",
                    "outpost-lag",
                    "placement-group",
                    "prefix-list",
                    "replace-root-volume-task",
                    "reserved-instances",
                    "route-table",
                    "security-group",
                    "security-group-rule",
                    "service-link-virtual-interface",
                    "snapshot",
                    "spot-fleet-request",
                    "spot-instances-request",
                    "subnet",
                    "subnet-cidr-reservation",
                    "traffic-mirror-filter",
                    "traffic-mirror-session",
                    "traffic-mirror-target",
                    "transit-gateway",
                    "transit-gateway-attachment",
                    "transit-gateway-connect-peer",
                    "transit-gateway-multicast-domain",
                    "transit-gateway-policy-table",
                    "transit-gateway-metering-policy",
                    "transit-gateway-route-table",
                    "transit-gateway-route-table-announcement",
                    "volume",
                    "vpc",
                    "vpc-endpoint",
                    "vpc-endpoint-connection",
                    "vpc-endpoint-service",
                    "vpc-endpoint-service-permission",
                    "vpc-peering-connection",
                    "vpn-connection",
                    "vpn-gateway",
                    "vpc-flow-log",
                    "capacity-reservation-fleet",
                    "traffic-mirror-filter-rule",
                    "vpc-endpoint-connection-device-type",
                    "verified-access-instance",
                    "verified-access-group",
                    "verified-access-endpoint",
                    "verified-access-policy",
                    "verified-access-trust-provider",
                    "vpn-connection-device-type",
                    "vpc-block-public-access-exclusion",
                    "vpc-encryption-control",
                    "route-server",
                    "route-server-endpoint",
                    "route-server-peer",
                    "ipam-resource-discovery",
                    "ipam-resource-discovery-association",
                    "instance-connect-endpoint",
                    "verified-access-endpoint-target",
                    "ipam-external-resource-verification-token",
                    "capacity-block",
                    "mac-modification-task",
                    "ipam-prefix-list-resolver",
                    "ipam-policy",
                    "ipam-prefix-list-resolver-target",
                    "secondary-interface",
                    "secondary-network",
                    "secondary-subnet",
                    "capacity-manager-data-export",
                    "vpn-concentrator",
                  ],
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
          type: {
            type: "string",
            enum: ["regional", "local"],
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
            enum: ["archive", "standard"],
            description: "The storage tier in which the snapshot is stored.",
          },
          RestoreExpiryTime: {
            type: "string",
            description:
              "Only for archived snapshots that are temporarily restored.",
          },
          SseType: {
            type: "string",
            enum: ["sse-ebs", "sse-kms", "none"],
            description: "Reserved for future use.",
          },
          AvailabilityZone: {
            type: "string",
            description: "The Availability Zone or Local Zone of the snapshot.",
          },
          TransferType: {
            type: "string",
            enum: ["time-based", "standard"],
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
            enum: [
              "pending",
              "completed",
              "error",
              "recoverable",
              "recovering",
            ],
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
