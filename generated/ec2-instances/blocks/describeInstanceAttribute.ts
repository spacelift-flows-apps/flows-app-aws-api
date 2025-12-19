import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeInstanceAttributeCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceAttribute: AppBlock = {
  name: "Describe Instance Attribute",
  description: `Describes the specified attribute of the specified instance.`,
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
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance.",
          type: "string",
          required: true,
        },
        Attribute: {
          name: "Attribute",
          description: "The instance attribute.",
          type: "string",
          required: true,
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

        const command = new DescribeInstanceAttributeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Attribute Result",
      description: "Result from DescribeInstanceAttribute operation",
      possiblePrimaryParents: ["default"],
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
                    AttachTime: {
                      type: "string",
                    },
                    DeleteOnTermination: {
                      type: "boolean",
                    },
                    Status: {
                      type: "string",
                    },
                    VolumeId: {
                      type: "string",
                    },
                    AssociatedResource: {
                      type: "string",
                    },
                    VolumeOwnerId: {
                      type: "string",
                    },
                    Operator: {
                      type: "object",
                      properties: {
                        Managed: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Principal: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The block device mapping of the instance.",
          },
          DisableApiTermination: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Indicates whether termination protection is enabled.",
          },
          EnaSupport: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether enhanced networking with ENA is enabled.",
          },
          EnclaveOptions: {
            type: "object",
            properties: {
              Enabled: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether the instance is enabled for Amazon Web Services Nitro Enclaves.",
          },
          EbsOptimized: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether the instance is optimized for Amazon EBS I/O.",
          },
          InstanceId: {
            type: "string",
            description: "The ID of the instance.",
          },
          InstanceInitiatedShutdownBehavior: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).",
          },
          InstanceType: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The instance type.",
          },
          KernelId: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The kernel ID.",
          },
          ProductCodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ProductCodeId: {
                  type: "string",
                },
                ProductCodeType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The product codes.",
          },
          RamdiskId: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The RAM disk ID.",
          },
          RootDeviceName: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The device name of the root device volume (for example, /dev/sda1).",
          },
          SourceDestCheck: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether source/destination checks are enabled.",
          },
          SriovNetSupport: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether enhanced networking with the Intel 82599 Virtual Function interface is enabled.",
          },
          UserData: {
            type: "object",
            properties: {
              Value: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The user data.",
          },
          DisableApiStop: {
            type: "object",
            properties: {
              Value: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "Indicates whether stop protection is enabled for the instance.",
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
            description: "The security groups associated with the instance.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceAttribute;
