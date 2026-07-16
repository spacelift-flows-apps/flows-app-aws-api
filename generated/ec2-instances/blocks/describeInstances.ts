import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstances: AppBlock = {
  name: "Describe Instances",
  description: `Describes the specified instances or all instances.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description: "The instance IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        IncludeManagedResources: {
          name: "Include Managed Resources",
          description:
            "Indicates whether to include managed resources in the output.",
          type: "boolean",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
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
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
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

        const command = new DescribeInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instances Result",
      description: "Result from DescribeInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Reservations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ReservationId: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
                RequesterId: {
                  type: "string",
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
                        items: {},
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
                          Arn: {},
                          Id: {},
                        },
                        additionalProperties: false,
                      },
                      InstanceLifecycle: {
                        type: "string",
                      },
                      ElasticGpuAssociations: {
                        type: "array",
                        items: {},
                      },
                      ElasticInferenceAcceleratorAssociations: {
                        type: "array",
                        items: {},
                      },
                      NetworkInterfaces: {
                        type: "array",
                        items: {},
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
                        items: {},
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
                          Code: {},
                          Message: {},
                        },
                        additionalProperties: false,
                      },
                      Tags: {
                        type: "array",
                        items: {},
                      },
                      VirtualizationType: {
                        type: "string",
                      },
                      CpuOptions: {
                        type: "object",
                        properties: {
                          CoreCount: {},
                          ThreadsPerCore: {},
                          AmdSevSnp: {},
                          NestedVirtualization: {},
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
                          CapacityReservationPreference: {},
                          CapacityReservationTarget: {},
                        },
                        additionalProperties: false,
                      },
                      HibernationOptions: {
                        type: "object",
                        properties: {
                          Configured: {},
                        },
                        additionalProperties: false,
                      },
                      Licenses: {
                        type: "array",
                        items: {},
                      },
                      MetadataOptions: {
                        type: "object",
                        properties: {
                          State: {},
                          HttpTokens: {},
                          HttpPutResponseHopLimit: {},
                          HttpEndpoint: {},
                          HttpProtocolIpv6: {},
                          InstanceMetadataTags: {},
                        },
                        additionalProperties: false,
                      },
                      EnclaveOptions: {
                        type: "object",
                        properties: {
                          Enabled: {},
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
                          HostnameType: {},
                          EnableResourceNameDnsARecord: {},
                          EnableResourceNameDnsAAAARecord: {},
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
                          AutoRecovery: {},
                          RebootMigration: {},
                        },
                        additionalProperties: false,
                      },
                      CurrentInstanceBootMode: {
                        type: "string",
                      },
                      NetworkPerformanceOptions: {
                        type: "object",
                        properties: {
                          BandwidthWeighting: {},
                        },
                        additionalProperties: false,
                      },
                      Operator: {
                        type: "object",
                        properties: {
                          Managed: {},
                          Principal: {},
                          HiddenByDefault: {},
                        },
                        additionalProperties: false,
                      },
                      SecondaryInterfaces: {
                        type: "array",
                        items: {},
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
                          Code: {},
                          Name: {},
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
                        items: {},
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
                          AvailabilityZoneId: {},
                          Affinity: {},
                          GroupName: {},
                          PartitionNumber: {},
                          HostId: {},
                          Tenancy: {},
                          SpreadDomain: {},
                          HostResourceGroupArn: {},
                          GroupId: {},
                          AvailabilityZone: {},
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
                          State: {},
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
                },
              },
              additionalProperties: false,
            },
            description: "Information about the reservations.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstances;
