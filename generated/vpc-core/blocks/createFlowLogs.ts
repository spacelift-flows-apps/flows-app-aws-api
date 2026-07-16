import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreateFlowLogsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createFlowLogs: AppBlock = {
  name: "Create Flow Logs",
  description: `Creates one or more flow logs to capture information about IP traffic for a specific network interface, subnet, or VPC.`,
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
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        DeliverLogsPermissionArn: {
          name: "Deliver Logs Permission Arn",
          description:
            "The ARN of the IAM role that allows Amazon EC2 to publish flow logs to the log destination.",
          type: "string",
          required: false,
        },
        DeliverCrossAccountRole: {
          name: "Deliver Cross Account Role",
          description:
            "The ARN of the IAM role that allows Amazon EC2 to publish flow logs across accounts.",
          type: "string",
          required: false,
        },
        LogGroupName: {
          name: "Log Group Name",
          description:
            "The name of a new or existing CloudWatch Logs log group where Amazon EC2 publishes your flow logs.",
          type: "string",
          required: false,
        },
        ResourceIds: {
          name: "Resource Ids",
          description: "The IDs of the resources to monitor.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        ResourceType: {
          name: "Resource Type",
          description: "The type of resource to monitor.",
          type: {
            type: "string",
            enum: [
              "VPC",
              "Subnet",
              "NetworkInterface",
              "TransitGateway",
              "TransitGatewayAttachment",
              "RegionalNatGateway",
            ],
          },
          required: true,
        },
        TrafficType: {
          name: "Traffic Type",
          description:
            "The type of traffic to monitor (accepted traffic, rejected traffic, or all traffic).",
          type: {
            type: "string",
            enum: ["ACCEPT", "REJECT", "ALL"],
          },
          required: false,
        },
        LogDestinationType: {
          name: "Log Destination Type",
          description: "The type of destination for the flow log data.",
          type: {
            type: "string",
            enum: ["cloud-watch-logs", "s3", "kinesis-data-firehose"],
          },
          required: false,
        },
        LogDestination: {
          name: "Log Destination",
          description: "The destination for the flow log data.",
          type: "string",
          required: false,
        },
        LogFormat: {
          name: "Log Format",
          description: "The fields to include in the flow log record.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the flow logs.",
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
        MaxAggregationInterval: {
          name: "Max Aggregation Interval",
          description:
            "The maximum interval of time during which a flow of packets is captured and aggregated into a flow log record.",
          type: "number",
          required: false,
        },
        DestinationOptions: {
          name: "Destination Options",
          description: "The destination options.",
          type: {
            type: "object",
            properties: {
              FileFormat: {
                type: "string",
                enum: ["plain-text", "parquet"],
              },
              HiveCompatiblePartitions: {
                type: "boolean",
              },
              PerHourPartition: {
                type: "boolean",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateFlowLogsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Flow Logs Result",
      description: "Result from CreateFlowLogs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClientToken: {
            type: "string",
            description:
              "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          },
          FlowLogIds: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The IDs of the flow logs.",
          },
          Unsuccessful: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Error: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                ResourceId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the flow logs that could not be created successfully.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createFlowLogs;
