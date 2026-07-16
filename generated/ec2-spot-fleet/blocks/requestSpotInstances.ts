import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, RequestSpotInstancesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const requestSpotInstances: AppBlock = {
  name: "Request Spot Instances",
  description: `Creates a Spot Instance request.`,
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
        LaunchSpecification: {
          name: "Launch Specification",
          description: "The launch specification.",
          type: {
            type: "object",
            properties: {
              SecurityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              SecurityGroups: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AddressingType: {
                type: "string",
              },
              BlockDeviceMappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Ebs: {
                      type: "object",
                      properties: {
                        DeleteOnTermination: {
                          type: "boolean",
                        },
                        Iops: {
                          type: "number",
                        },
                        SnapshotId: {
                          type: "string",
                        },
                        VolumeSize: {
                          type: "number",
                        },
                        VolumeType: {
                          type: "string",
                        },
                        KmsKeyId: {
                          type: "string",
                        },
                        Throughput: {
                          type: "number",
                        },
                        OutpostArn: {
                          type: "string",
                        },
                        AvailabilityZone: {
                          type: "string",
                        },
                        Encrypted: {
                          type: "boolean",
                        },
                        VolumeInitializationRate: {
                          type: "number",
                        },
                        AvailabilityZoneId: {
                          type: "string",
                        },
                        EbsCardIndex: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    NoDevice: {
                      type: "string",
                    },
                    DeviceName: {
                      type: "string",
                    },
                    VirtualName: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              EbsOptimized: {
                type: "boolean",
              },
              IamInstanceProfile: {
                type: "object",
                properties: {
                  Arn: {
                    type: "string",
                  },
                  Name: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              ImageId: {
                type: "string",
              },
              InstanceType: {
                type: "string",
              },
              KernelId: {
                type: "string",
              },
              KeyName: {
                type: "string",
              },
              Monitoring: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                },
                required: ["Enabled"],
                additionalProperties: false,
              },
              NetworkInterfaces: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AssociatePublicIpAddress: {
                      type: "boolean",
                    },
                    DeleteOnTermination: {
                      type: "boolean",
                    },
                    Description: {
                      type: "string",
                    },
                    DeviceIndex: {
                      type: "number",
                    },
                    Groups: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    Ipv6AddressCount: {
                      type: "number",
                    },
                    Ipv6Addresses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Ipv6Address: {},
                          IsPrimaryIpv6: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    NetworkInterfaceId: {
                      type: "string",
                    },
                    PrivateIpAddress: {
                      type: "string",
                    },
                    PrivateIpAddresses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Primary: {},
                          PrivateIpAddress: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    SecondaryPrivateIpAddressCount: {
                      type: "number",
                    },
                    SubnetId: {
                      type: "string",
                    },
                    AssociateCarrierIpAddress: {
                      type: "boolean",
                    },
                    InterfaceType: {
                      type: "string",
                    },
                    NetworkCardIndex: {
                      type: "number",
                    },
                    Ipv4Prefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Ipv4Prefix: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Ipv4PrefixCount: {
                      type: "number",
                    },
                    Ipv6Prefixes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Ipv6Prefix: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Ipv6PrefixCount: {
                      type: "number",
                    },
                    PrimaryIpv6: {
                      type: "boolean",
                    },
                    EnaSrdSpecification: {
                      type: "object",
                      properties: {
                        EnaSrdEnabled: {
                          type: "boolean",
                        },
                        EnaSrdUdpSpecification: {
                          type: "object",
                          properties: {
                            EnaSrdUdpEnabled: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                    ConnectionTrackingSpecification: {
                      type: "object",
                      properties: {
                        TcpEstablishedTimeout: {
                          type: "number",
                        },
                        UdpStreamTimeout: {
                          type: "number",
                        },
                        UdpTimeout: {
                          type: "number",
                        },
                      },
                      additionalProperties: false,
                    },
                    EnaQueueCount: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Placement: {
                type: "object",
                properties: {
                  AvailabilityZone: {
                    type: "string",
                  },
                  GroupName: {
                    type: "string",
                  },
                  Tenancy: {
                    type: "string",
                  },
                  AvailabilityZoneId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              RamdiskId: {
                type: "string",
              },
              SubnetId: {
                type: "string",
              },
              UserData: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The key-value pair for tagging the Spot Instance request on creation.",
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
        InstanceInterruptionBehavior: {
          name: "Instance Interruption Behavior",
          description: "The behavior when a Spot Instance is interrupted.",
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
        SpotPrice: {
          name: "Spot Price",
          description:
            "The maximum price per unit hour that you are willing to pay for a Spot Instance.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        InstanceCount: {
          name: "Instance Count",
          description: "The maximum number of Spot Instances to launch.",
          type: "number",
          required: false,
        },
        Type: {
          name: "Type",
          description: "The Spot Instance request type.",
          type: "string",
          required: false,
        },
        ValidFrom: {
          name: "Valid From",
          description: "The start date of the request.",
          type: "string",
          required: false,
        },
        ValidUntil: {
          name: "Valid Until",
          description:
            "The end date of the request, in UTC format (YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        LaunchGroup: {
          name: "Launch Group",
          description: "The instance launch group.",
          type: "string",
          required: false,
        },
        AvailabilityZoneGroup: {
          name: "Availability Zone Group",
          description:
            "The user-specified name for a logical grouping of requests.",
          type: "string",
          required: false,
        },
        BlockDurationMinutes: {
          name: "Block Duration Minutes",
          description: "Deprecated.",
          type: "number",
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

        const command = new RequestSpotInstancesCommand(
          convertTimestamps(
            commandInput,
            new Set(["ValidFrom", "ValidUntil"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Request Spot Instances Result",
      description: "Result from RequestSpotInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SpotInstanceRequests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActualBlockHourlyPrice: {
                  type: "string",
                },
                AvailabilityZoneGroup: {
                  type: "string",
                },
                BlockDurationMinutes: {
                  type: "number",
                },
                CreateTime: {
                  type: "string",
                },
                Fault: {
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
                InstanceId: {
                  type: "string",
                },
                LaunchGroup: {
                  type: "string",
                },
                LaunchSpecification: {
                  type: "object",
                  properties: {
                    UserData: {
                      type: "string",
                    },
                    AddressingType: {
                      type: "string",
                    },
                    BlockDeviceMappings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Ebs: {},
                          NoDevice: {},
                          DeviceName: {},
                          VirtualName: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    EbsOptimized: {
                      type: "boolean",
                    },
                    IamInstanceProfile: {
                      type: "object",
                      properties: {
                        Arn: {
                          type: "string",
                        },
                        Name: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    ImageId: {
                      type: "string",
                    },
                    InstanceType: {
                      type: "string",
                    },
                    KernelId: {
                      type: "string",
                    },
                    KeyName: {
                      type: "string",
                    },
                    NetworkInterfaces: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          AssociatePublicIpAddress: {},
                          DeleteOnTermination: {},
                          Description: {},
                          DeviceIndex: {},
                          Groups: {},
                          Ipv6AddressCount: {},
                          Ipv6Addresses: {},
                          NetworkInterfaceId: {},
                          PrivateIpAddress: {},
                          PrivateIpAddresses: {},
                          SecondaryPrivateIpAddressCount: {},
                          SubnetId: {},
                          AssociateCarrierIpAddress: {},
                          InterfaceType: {},
                          NetworkCardIndex: {},
                          Ipv4Prefixes: {},
                          Ipv4PrefixCount: {},
                          Ipv6Prefixes: {},
                          Ipv6PrefixCount: {},
                          PrimaryIpv6: {},
                          EnaSrdSpecification: {},
                          ConnectionTrackingSpecification: {},
                          EnaQueueCount: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Placement: {
                      type: "object",
                      properties: {
                        AvailabilityZone: {
                          type: "string",
                        },
                        GroupName: {
                          type: "string",
                        },
                        Tenancy: {
                          type: "string",
                        },
                        AvailabilityZoneId: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    RamdiskId: {
                      type: "string",
                    },
                    SubnetId: {
                      type: "string",
                    },
                    SecurityGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          GroupId: {},
                          GroupName: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Monitoring: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "boolean",
                        },
                      },
                      required: ["Enabled"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                LaunchedAvailabilityZone: {
                  type: "string",
                },
                LaunchedAvailabilityZoneId: {
                  type: "string",
                },
                ProductDescription: {
                  type: "string",
                },
                SpotInstanceRequestId: {
                  type: "string",
                },
                SpotPrice: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                Status: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                    UpdateTime: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
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
                Type: {
                  type: "string",
                },
                ValidFrom: {
                  type: "string",
                },
                ValidUntil: {
                  type: "string",
                },
                InstanceInterruptionBehavior: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The Spot Instance requests.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default requestSpotInstances;
