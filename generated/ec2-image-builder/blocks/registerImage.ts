import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, RegisterImageCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const registerImage: AppBlock = {
  name: "Register Image",
  description: `Registers an AMI.`,
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
        ImageLocation: {
          name: "Image Location",
          description:
            "The full path to your AMI manifest in Amazon S3 storage.",
          type: "string",
          required: false,
        },
        BillingProducts: {
          name: "Billing Products",
          description: "The billing product codes.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        BootMode: {
          name: "Boot Mode",
          description: "The boot mode of the AMI.",
          type: "string",
          required: false,
        },
        TpmSupport: {
          name: "Tpm Support",
          description: "Set to v2.",
          type: "string",
          required: false,
        },
        UefiData: {
          name: "Uefi Data",
          description:
            "Base64 representation of the non-volatile UEFI variable store.",
          type: "string",
          required: false,
        },
        ImdsSupport: {
          name: "Imds Support",
          description: "Set to v2.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the AMI.",
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Name: {
          name: "Name",
          description: "A name for your AMI.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for your AMI.",
          type: "string",
          required: false,
        },
        Architecture: {
          name: "Architecture",
          description: "The architecture of the AMI.",
          type: "string",
          required: false,
        },
        KernelId: {
          name: "Kernel Id",
          description: "The ID of the kernel.",
          type: "string",
          required: false,
        },
        RamdiskId: {
          name: "Ramdisk Id",
          description: "The ID of the RAM disk.",
          type: "string",
          required: false,
        },
        RootDeviceName: {
          name: "Root Device Name",
          description:
            "The device name of the root device volume (for example, /dev/sda1).",
          type: "string",
          required: false,
        },
        BlockDeviceMappings: {
          name: "Block Device Mappings",
          description: "The block device mapping entries.",
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
        VirtualizationType: {
          name: "Virtualization Type",
          description: "The type of virtualization (hvm | paravirtual).",
          type: "string",
          required: false,
        },
        SriovNetSupport: {
          name: "Sriov Net Support",
          description:
            "Set to simple to enable enhanced networking with the Intel 82599 Virtual Function interface for the AMI and any instances that you launch from the AMI.",
          type: "string",
          required: false,
        },
        EnaSupport: {
          name: "Ena Support",
          description:
            "Set to true to enable enhanced networking with ENA for the AMI and any instances that you launch from the AMI.",
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

        const command = new RegisterImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Register Image Result",
      description: "Result from RegisterImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImageId: {
            type: "string",
            description: "The ID of the newly registered AMI.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default registerImage;
