import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, PurchaseCapacityBlockCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const purchaseCapacityBlock: AppBlock = {
  name: "Purchase Capacity Block",
  description: `Purchase the Capacity Block for use with your account.`,
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
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the Capacity Block during launch.",
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
        CapacityBlockOfferingId: {
          name: "Capacity Block Offering Id",
          description: "The ID of the Capacity Block offering.",
          type: "string",
          required: true,
        },
        InstancePlatform: {
          name: "Instance Platform",
          description:
            "The type of operating system for which to reserve capacity.",
          type: {
            type: "string",
            enum: [
              "Linux/UNIX",
              "Red Hat Enterprise Linux",
              "SUSE Linux",
              "Windows",
              "Windows with SQL Server",
              "Windows with SQL Server Enterprise",
              "Windows with SQL Server Standard",
              "Windows with SQL Server Web",
              "Linux with SQL Server Standard",
              "Linux with SQL Server Web",
              "Linux with SQL Server Enterprise",
              "RHEL with SQL Server Standard",
              "RHEL with SQL Server Enterprise",
              "RHEL with SQL Server Web",
              "RHEL with HA",
              "RHEL with HA and SQL Server Standard",
              "RHEL with HA and SQL Server Enterprise",
              "Ubuntu Pro",
            ],
          },
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

        const command = new PurchaseCapacityBlockCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Purchase Capacity Block Result",
      description: "Result from PurchaseCapacityBlock operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityReservation: {
            type: "object",
            properties: {
              CapacityReservationId: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              CapacityReservationArn: {
                type: "string",
              },
              AvailabilityZoneId: {
                type: "string",
              },
              InstanceType: {
                type: "string",
              },
              InstancePlatform: {
                type: "string",
                enum: [
                  "Linux/UNIX",
                  "Red Hat Enterprise Linux",
                  "SUSE Linux",
                  "Windows",
                  "Windows with SQL Server",
                  "Windows with SQL Server Enterprise",
                  "Windows with SQL Server Standard",
                  "Windows with SQL Server Web",
                  "Linux with SQL Server Standard",
                  "Linux with SQL Server Web",
                  "Linux with SQL Server Enterprise",
                  "RHEL with SQL Server Standard",
                  "RHEL with SQL Server Enterprise",
                  "RHEL with SQL Server Web",
                  "RHEL with HA",
                  "RHEL with HA and SQL Server Standard",
                  "RHEL with HA and SQL Server Enterprise",
                  "Ubuntu Pro",
                ],
              },
              AvailabilityZone: {
                type: "string",
              },
              Tenancy: {
                type: "string",
                enum: ["default", "dedicated"],
              },
              TotalInstanceCount: {
                type: "number",
              },
              AvailableInstanceCount: {
                type: "number",
              },
              EbsOptimized: {
                type: "boolean",
              },
              EphemeralStorage: {
                type: "boolean",
              },
              State: {
                type: "string",
                enum: [
                  "active",
                  "expired",
                  "cancelled",
                  "pending",
                  "failed",
                  "scheduled",
                  "payment-pending",
                  "payment-failed",
                  "assessing",
                  "delayed",
                  "unsupported",
                  "unavailable",
                ],
              },
              StartDate: {
                type: "string",
              },
              EndDate: {
                type: "string",
              },
              EndDateType: {
                type: "string",
                enum: ["unlimited", "limited"],
              },
              InstanceMatchCriteria: {
                type: "string",
                enum: ["open", "targeted"],
              },
              CreateDate: {
                type: "string",
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
              OutpostArn: {
                type: "string",
              },
              CapacityReservationFleetId: {
                type: "string",
              },
              PlacementGroupArn: {
                type: "string",
              },
              CapacityAllocations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AllocationType: {
                      type: "string",
                      enum: ["used", "future"],
                    },
                    Count: {
                      type: "number",
                    },
                    AllocationMetadata: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Key: {},
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ReservationType: {
                type: "string",
                enum: ["default", "capacity-block"],
              },
              UnusedReservationBillingOwnerId: {
                type: "string",
              },
              CommitmentInfo: {
                type: "object",
                properties: {
                  CommittedInstanceCount: {
                    type: "number",
                  },
                  CommitmentEndDate: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DeliveryPreference: {
                type: "string",
                enum: ["fixed", "incremental"],
              },
              CapacityBlockId: {
                type: "string",
              },
              Interruptible: {
                type: "boolean",
              },
              InterruptibleCapacityAllocation: {
                type: "object",
                properties: {
                  InstanceCount: {
                    type: "number",
                  },
                  TargetInstanceCount: {
                    type: "number",
                  },
                  Status: {
                    type: "string",
                    enum: [
                      "pending",
                      "active",
                      "updating",
                      "canceling",
                      "canceled",
                      "failed",
                    ],
                  },
                  InterruptibleCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
              InterruptionInfo: {
                type: "object",
                properties: {
                  SourceCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The Capacity Reservation.",
          },
          CapacityBlocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CapacityBlockId: {
                  type: "string",
                },
                UltraserverType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                CapacityReservationIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                StartDate: {
                  type: "string",
                },
                EndDate: {
                  type: "string",
                },
                CreateDate: {
                  type: "string",
                },
                State: {
                  type: "string",
                  enum: [
                    "active",
                    "expired",
                    "unavailable",
                    "cancelled",
                    "failed",
                    "scheduled",
                    "payment-pending",
                    "payment-failed",
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
            description: "The Capacity Block.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default purchaseCapacityBlock;
