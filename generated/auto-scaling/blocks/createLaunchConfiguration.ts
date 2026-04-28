import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  CreateLaunchConfigurationCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createLaunchConfiguration: AppBlock = {
  name: "Create Launch Configuration",
  description: `Creates a launch configuration.`,
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
        LaunchConfigurationName: {
          name: "Launch Configuration Name",
          description: "The name of the launch configuration.",
          type: "string",
          required: true,
        },
        ImageId: {
          name: "Image Id",
          description:
            "The ID of the Amazon Machine Image (AMI) that was assigned during registration.",
          type: "string",
          required: false,
        },
        KeyName: {
          name: "Key Name",
          description: "The name of the key pair.",
          type: "string",
          required: false,
        },
        SecurityGroups: {
          name: "Security Groups",
          description:
            "A list that contains the security group IDs to assign to the instances in the Auto Scaling group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ClassicLinkVPCId: {
          name: "Classic Link VPC Id",
          description: "Available for backward compatibility.",
          type: "string",
          required: false,
        },
        ClassicLinkVPCSecurityGroups: {
          name: "Classic Link VPC Security Groups",
          description: "Available for backward compatibility.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        UserData: {
          name: "User Data",
          description:
            "The user data to make available to the launched EC2 instances.",
          type: "string",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description:
            "The ID of the instance to use to create the launch configuration.",
          type: "string",
          required: false,
        },
        InstanceType: {
          name: "Instance Type",
          description: "Specifies the instance type of the EC2 instance.",
          type: "string",
          required: false,
        },
        KernelId: {
          name: "Kernel Id",
          description: "The ID of the kernel associated with the AMI.",
          type: "string",
          required: false,
        },
        RamdiskId: {
          name: "Ramdisk Id",
          description: "The ID of the RAM disk to select.",
          type: "string",
          required: false,
        },
        BlockDeviceMappings: {
          name: "Block Device Mappings",
          description:
            "The block device mapping entries that define the block devices to attach to the instances at launch.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                VirtualName: {
                  type: "string",
                },
                DeviceName: {
                  type: "string",
                },
                Ebs: {
                  type: "object",
                  properties: {
                    SnapshotId: {
                      type: "string",
                    },
                    VolumeSize: {
                      type: "number",
                    },
                    VolumeType: {
                      type: "string",
                    },
                    DeleteOnTermination: {
                      type: "boolean",
                    },
                    Iops: {
                      type: "number",
                    },
                    Encrypted: {
                      type: "boolean",
                    },
                    Throughput: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                NoDevice: {
                  type: "boolean",
                },
              },
              required: ["DeviceName"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        InstanceMonitoring: {
          name: "Instance Monitoring",
          description:
            "Controls whether instances in this group are launched with detailed (true) or basic (false) monitoring.",
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
        SpotPrice: {
          name: "Spot Price",
          description:
            "The maximum hourly price to be paid for any Spot Instance launched to fulfill the request.",
          type: "string",
          required: false,
        },
        IamInstanceProfile: {
          name: "Iam Instance Profile",
          description:
            "The name or the Amazon Resource Name (ARN) of the instance profile associated with the IAM role for the instance.",
          type: "string",
          required: false,
        },
        EbsOptimized: {
          name: "Ebs Optimized",
          description:
            "Specifies whether the launch configuration is optimized for EBS I/O (true) or not (false).",
          type: "boolean",
          required: false,
        },
        AssociatePublicIpAddress: {
          name: "Associate Public Ip Address",
          description:
            "Specifies whether to assign a public IPv4 address to the group's instances.",
          type: "boolean",
          required: false,
        },
        PlacementTenancy: {
          name: "Placement Tenancy",
          description:
            "The tenancy of the instance, either default or dedicated.",
          type: "string",
          required: false,
        },
        MetadataOptions: {
          name: "Metadata Options",
          description: "The metadata options for the instances.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateLaunchConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Launch Configuration Result",
      description: "Result from CreateLaunchConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default createLaunchConfiguration;
