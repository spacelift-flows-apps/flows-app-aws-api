import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const runInstances: AppBlock = {
  name: "Run Instances",
  description: `Launches the specified number of instances using an AMI for which you have permissions.`,
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
        BlockDeviceMappings: {
          name: "Block Device Mappings",
          description:
            "The block device mapping, which defines the EBS volumes and instance store volumes to attach to the instance at launch.",
          type: {
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
          required: false,
        },
        ImageId: {
          name: "Image Id",
          description: "The ID of the AMI.",
          type: "string",
          required: false,
        },
        InstanceType: {
          name: "Instance Type",
          description: "The instance type.",
          type: "string",
          required: false,
        },
        Ipv6AddressCount: {
          name: "Ipv6Address Count",
          description:
            "The number of IPv6 addresses to associate with the primary network interface.",
          type: "number",
          required: false,
        },
        Ipv6Addresses: {
          name: "Ipv6Addresses",
          description:
            "The IPv6 addresses from the range of the subnet to associate with the primary network interface.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Ipv6Address: {
                  type: "string",
                },
                IsPrimaryIpv6: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        KernelId: {
          name: "Kernel Id",
          description: "The ID of the kernel.",
          type: "string",
          required: false,
        },
        KeyName: {
          name: "Key Name",
          description: "The name of the key pair.",
          type: "string",
          required: false,
        },
        MaxCount: {
          name: "Max Count",
          description: "The maximum number of instances to launch.",
          type: "number",
          required: true,
        },
        MinCount: {
          name: "Min Count",
          description: "The minimum number of instances to launch.",
          type: "number",
          required: true,
        },
        Monitoring: {
          name: "Monitoring",
          description:
            "Specifies whether detailed monitoring is enabled for the instance.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
            },
            required: ["Enabled"],
            additionalProperties: false,
          },
          required: false,
        },
        Placement: {
          name: "Placement",
          description: "The placement for the instance.",
          type: {
            type: "object",
            properties: {
              Affinity: {
                type: "string",
              },
              GroupName: {
                type: "string",
              },
              PartitionNumber: {
                type: "number",
              },
              HostId: {
                type: "string",
              },
              Tenancy: {
                type: "string",
              },
              SpreadDomain: {
                type: "string",
              },
              HostResourceGroupArn: {
                type: "string",
              },
              GroupId: {
                type: "string",
              },
              AvailabilityZone: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        RamdiskId: {
          name: "Ramdisk Id",
          description: "The ID of the RAM disk to select.",
          type: "string",
          required: false,
        },
        SecurityGroupIds: {
          name: "Security Group Ids",
          description: "The IDs of the security groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SecurityGroups: {
          name: "Security Groups",
          description: "[Default VPC] The names of the security groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        SubnetId: {
          name: "Subnet Id",
          description: "The ID of the subnet to launch the instance into.",
          type: "string",
          required: false,
        },
        UserData: {
          name: "User Data",
          description: "The user data to make available to the instance.",
          type: "string",
          required: false,
        },
        ElasticGpuSpecification: {
          name: "Elastic Gpu Specification",
          description: "An elastic GPU to associate with the instance.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
              },
              required: ["Type"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ElasticInferenceAccelerators: {
          name: "Elastic Inference Accelerators",
          description:
            "An elastic inference accelerator to associate with the instance.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                Count: {
                  type: "number",
                },
              },
              required: ["Type"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The tags to apply to the resources that are created during instance launch.",
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
        LaunchTemplate: {
          name: "Launch Template",
          description: "The launch template.",
          type: {
            type: "object",
            properties: {
              LaunchTemplateId: {
                type: "string",
              },
              LaunchTemplateName: {
                type: "string",
              },
              Version: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        InstanceMarketOptions: {
          name: "Instance Market Options",
          description: "The market (purchasing) option for the instances.",
          type: {
            type: "object",
            properties: {
              MarketType: {
                type: "string",
              },
              SpotOptions: {
                type: "object",
                properties: {
                  MaxPrice: {
                    type: "string",
                  },
                  SpotInstanceType: {
                    type: "string",
                  },
                  BlockDurationMinutes: {
                    type: "number",
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
            },
            additionalProperties: false,
          },
          required: false,
        },
        CreditSpecification: {
          name: "Credit Specification",
          description:
            "The credit option for CPU usage of the burstable performance instance.",
          type: {
            type: "object",
            properties: {
              CpuCredits: {
                type: "string",
              },
            },
            required: ["CpuCredits"],
            additionalProperties: false,
          },
          required: false,
        },
        CpuOptions: {
          name: "Cpu Options",
          description: "The CPU options for the instance.",
          type: {
            type: "object",
            properties: {
              CoreCount: {
                type: "number",
              },
              ThreadsPerCore: {
                type: "number",
              },
              AmdSevSnp: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CapacityReservationSpecification: {
          name: "Capacity Reservation Specification",
          description:
            "Information about the Capacity Reservation targeting option.",
          type: {
            type: "object",
            properties: {
              CapacityReservationPreference: {
                type: "string",
              },
              CapacityReservationTarget: {
                type: "object",
                properties: {
                  CapacityReservationId: {
                    type: "string",
                  },
                  CapacityReservationResourceGroupArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        HibernationOptions: {
          name: "Hibernation Options",
          description:
            "Indicates whether an instance is enabled for hibernation.",
          type: {
            type: "object",
            properties: {
              Configured: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        LicenseSpecifications: {
          name: "License Specifications",
          description: "The license configurations.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LicenseConfigurationArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        MetadataOptions: {
          name: "Metadata Options",
          description: "The metadata options for the instance.",
          type: {
            type: "object",
            properties: {
              HttpTokens: {
                type: "string",
              },
              HttpPutResponseHopLimit: {
                type: "number",
              },
              HttpEndpoint: {
                type: "string",
              },
              HttpProtocolIpv6: {
                type: "string",
              },
              InstanceMetadataTags: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        EnclaveOptions: {
          name: "Enclave Options",
          description:
            "Indicates whether the instance is enabled for Amazon Web Services Nitro Enclaves.",
          type: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        PrivateDnsNameOptions: {
          name: "Private Dns Name Options",
          description: "The options for the instance hostname.",
          type: {
            type: "object",
            properties: {
              HostnameType: {
                type: "string",
              },
              EnableResourceNameDnsARecord: {
                type: "boolean",
              },
              EnableResourceNameDnsAAAARecord: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        MaintenanceOptions: {
          name: "Maintenance Options",
          description: "The maintenance and recovery options for the instance.",
          type: {
            type: "object",
            properties: {
              AutoRecovery: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        DisableApiStop: {
          name: "Disable Api Stop",
          description:
            "Indicates whether an instance is enabled for stop protection.",
          type: "boolean",
          required: false,
        },
        EnablePrimaryIpv6: {
          name: "Enable Primary Ipv6",
          description:
            "If you’re launching an instance into a dual-stack or IPv6-only subnet, you can enable assigning a primary IPv6 address.",
          type: "boolean",
          required: false,
        },
        NetworkPerformanceOptions: {
          name: "Network Performance Options",
          description:
            "Contains settings for the network performance options for the instance.",
          type: {
            type: "object",
            properties: {
              BandwidthWeighting: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
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
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        DisableApiTermination: {
          name: "Disable Api Termination",
          description:
            "Indicates whether termination protection is enabled for the instance.",
          type: "boolean",
          required: false,
        },
        InstanceInitiatedShutdownBehavior: {
          name: "Instance Initiated Shutdown Behavior",
          description:
            "Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).",
          type: "string",
          required: false,
        },
        PrivateIpAddress: {
          name: "Private Ip Address",
          description: "The primary IPv4 address.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        AdditionalInfo: {
          name: "Additional Info",
          description: "Reserved.",
          type: "string",
          required: false,
        },
        NetworkInterfaces: {
          name: "Network Interfaces",
          description: "The network interfaces to associate with the instance.",
          type: {
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
                      Ipv6Address: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsPrimaryIpv6: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                      Primary: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateIpAddress: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                      Ipv4Prefix: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                      Ipv6Prefix: {
                        type: "object",
                        additionalProperties: true,
                      },
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
                        EnaSrdUdpEnabled: {
                          type: "object",
                          additionalProperties: true,
                        },
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
          required: false,
        },
        IamInstanceProfile: {
          name: "Iam Instance Profile",
          description:
            "The name or Amazon Resource Name (ARN) of an IAM instance profile.",
          type: {
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
          required: false,
        },
        EbsOptimized: {
          name: "Ebs Optimized",
          description:
            "Indicates whether the instance is optimized for Amazon EBS I/O.",
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

        const command = new RunInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Run Instances Result",
      description: "Result from RunInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReservationId: {
            type: "string",
            description: "The ID of the reservation.",
          },
          OwnerId: {
            type: "string",
            description:
              "The ID of the Amazon Web Services account that owns the reservation.",
          },
          RequesterId: {
            type: "string",
            description:
              "The ID of the requester that launched the instances on your behalf (for example, Amazon Web Services Management Console or Auto Scaling).",
          },
          Groups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                GroupId: {
                  type: "string",
                },
                GroupName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Not supported.",
          },
          Instances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Architecture: {
                  type: "string",
                },
                BlockDeviceMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      DeviceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ebs: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ClientToken: {
                  type: "string",
                },
                EbsOptimized: {
                  type: "boolean",
                },
                EnaSupport: {
                  type: "boolean",
                },
                Hypervisor: {
                  type: "string",
                },
                IamInstanceProfile: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                    Id: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                InstanceLifecycle: {
                  type: "string",
                },
                ElasticGpuAssociations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ElasticGpuId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticGpuAssociationId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticGpuAssociationState: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticGpuAssociationTime: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ElasticInferenceAcceleratorAssociations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ElasticInferenceAcceleratorArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticInferenceAcceleratorAssociationId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticInferenceAcceleratorAssociationState: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ElasticInferenceAcceleratorAssociationTime: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                NetworkInterfaces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Association: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Attachment: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Groups: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6Addresses: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MacAddress: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NetworkInterfaceId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OwnerId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateDnsName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateIpAddress: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PrivateIpAddresses: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SourceDestCheck: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      VpcId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InterfaceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv4Prefixes: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ipv6Prefixes: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ConnectionTrackingConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Operator: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                OutpostArn: {
                  type: "string",
                },
                RootDeviceName: {
                  type: "string",
                },
                RootDeviceType: {
                  type: "string",
                },
                SecurityGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      GroupId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      GroupName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SourceDestCheck: {
                  type: "boolean",
                },
                SpotInstanceRequestId: {
                  type: "string",
                },
                SriovNetSupport: {
                  type: "string",
                },
                StateReason: {
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
                VirtualizationType: {
                  type: "string",
                },
                CpuOptions: {
                  type: "object",
                  properties: {
                    CoreCount: {
                      type: "number",
                    },
                    ThreadsPerCore: {
                      type: "number",
                    },
                    AmdSevSnp: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                CapacityBlockId: {
                  type: "string",
                },
                CapacityReservationId: {
                  type: "string",
                },
                CapacityReservationSpecification: {
                  type: "object",
                  properties: {
                    CapacityReservationPreference: {
                      type: "string",
                    },
                    CapacityReservationTarget: {
                      type: "object",
                      properties: {
                        CapacityReservationId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CapacityReservationResourceGroupArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                HibernationOptions: {
                  type: "object",
                  properties: {
                    Configured: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                Licenses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      LicenseConfigurationArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                MetadataOptions: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    HttpTokens: {
                      type: "string",
                    },
                    HttpPutResponseHopLimit: {
                      type: "number",
                    },
                    HttpEndpoint: {
                      type: "string",
                    },
                    HttpProtocolIpv6: {
                      type: "string",
                    },
                    InstanceMetadataTags: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                EnclaveOptions: {
                  type: "object",
                  properties: {
                    Enabled: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                BootMode: {
                  type: "string",
                },
                PlatformDetails: {
                  type: "string",
                },
                UsageOperation: {
                  type: "string",
                },
                UsageOperationUpdateTime: {
                  type: "string",
                },
                PrivateDnsNameOptions: {
                  type: "object",
                  properties: {
                    HostnameType: {
                      type: "string",
                    },
                    EnableResourceNameDnsARecord: {
                      type: "boolean",
                    },
                    EnableResourceNameDnsAAAARecord: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                Ipv6Address: {
                  type: "string",
                },
                TpmSupport: {
                  type: "string",
                },
                MaintenanceOptions: {
                  type: "object",
                  properties: {
                    AutoRecovery: {
                      type: "string",
                    },
                    RebootMigration: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                CurrentInstanceBootMode: {
                  type: "string",
                },
                NetworkPerformanceOptions: {
                  type: "object",
                  properties: {
                    BandwidthWeighting: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
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
                },
                InstanceId: {
                  type: "string",
                },
                ImageId: {
                  type: "string",
                },
                State: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "number",
                    },
                    Name: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                PrivateDnsName: {
                  type: "string",
                },
                PublicDnsName: {
                  type: "string",
                },
                StateTransitionReason: {
                  type: "string",
                },
                KeyName: {
                  type: "string",
                },
                AmiLaunchIndex: {
                  type: "number",
                },
                ProductCodes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ProductCodeId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProductCodeType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                InstanceType: {
                  type: "string",
                },
                LaunchTime: {
                  type: "string",
                },
                Placement: {
                  type: "object",
                  properties: {
                    Affinity: {
                      type: "string",
                    },
                    GroupName: {
                      type: "string",
                    },
                    PartitionNumber: {
                      type: "number",
                    },
                    HostId: {
                      type: "string",
                    },
                    Tenancy: {
                      type: "string",
                    },
                    SpreadDomain: {
                      type: "string",
                    },
                    HostResourceGroupArn: {
                      type: "string",
                    },
                    GroupId: {
                      type: "string",
                    },
                    AvailabilityZone: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                KernelId: {
                  type: "string",
                },
                RamdiskId: {
                  type: "string",
                },
                Platform: {
                  type: "string",
                },
                Monitoring: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                SubnetId: {
                  type: "string",
                },
                VpcId: {
                  type: "string",
                },
                PrivateIpAddress: {
                  type: "string",
                },
                PublicIpAddress: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default runInstances;
