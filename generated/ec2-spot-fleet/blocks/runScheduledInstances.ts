import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, RunScheduledInstancesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const runScheduledInstances: AppBlock = {
  name: "Run Scheduled Instances",
  description: `Launches the specified Scheduled Instances.`,
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
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that ensures the idempotency of the request.",
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
        InstanceCount: {
          name: "Instance Count",
          description: "The number of instances.",
          type: "number",
          required: false,
        },
        LaunchSpecification: {
          name: "Launch Specification",
          description: "The launch specification.",
          type: {
            type: "object",
            properties: {
              BlockDeviceMappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DeviceName: {
                      type: "string",
                    },
                    Ebs: {
                      type: "object",
                      properties: {
                        DeleteOnTermination: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Encrypted: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Iops: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SnapshotId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VolumeSize: {
                          type: "object",
                          additionalProperties: true,
                        },
                        VolumeType: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    NoDevice: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Ipv6AddressCount: {
                      type: "number",
                    },
                    Ipv6Addresses: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    NetworkInterfaceId: {
                      type: "string",
                    },
                    PrivateIpAddress: {
                      type: "string",
                    },
                    PrivateIpAddressConfigs: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SecondaryPrivateIpAddressCount: {
                      type: "number",
                    },
                    SubnetId: {
                      type: "string",
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
                },
                additionalProperties: false,
              },
              RamdiskId: {
                type: "string",
              },
              SecurityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              SubnetId: {
                type: "string",
              },
              UserData: {
                type: "string",
              },
            },
            required: ["ImageId"],
            additionalProperties: false,
          },
          required: true,
        },
        ScheduledInstanceId: {
          name: "Scheduled Instance Id",
          description: "The Scheduled Instance ID.",
          type: "string",
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

        const command = new RunScheduledInstancesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Run Scheduled Instances Result",
      description: "Result from RunScheduledInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceIdSet: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The IDs of the newly launched instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default runScheduledInstances;
