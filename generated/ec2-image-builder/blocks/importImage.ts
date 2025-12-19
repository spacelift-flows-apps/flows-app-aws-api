import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ImportImageCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importImage: AppBlock = {
  name: "Import Image",
  description: `To import your virtual machines (VMs) with a console-based experience, you can use the Import virtual machine images to Amazon Web Services template in the Migration Hub Orchestrator console.`,
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
        Architecture: {
          name: "Architecture",
          description: "The architecture of the virtual machine.",
          type: "string",
          required: false,
        },
        ClientData: {
          name: "Client Data",
          description: "The client-specific data.",
          type: {
            type: "object",
            properties: {
              Comment: {
                type: "string",
              },
              UploadEnd: {
                type: "string",
              },
              UploadSize: {
                type: "number",
              },
              UploadStart: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "The token to enable idempotency for VM import requests.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description string for the import image task.",
          type: "string",
          required: false,
        },
        DiskContainers: {
          name: "Disk Containers",
          description: "Information about the disk containers.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Description: {
                  type: "string",
                },
                DeviceName: {
                  type: "string",
                },
                Format: {
                  type: "string",
                },
                SnapshotId: {
                  type: "string",
                },
                Url: {
                  type: "string",
                },
                UserBucket: {
                  type: "object",
                  properties: {
                    S3Bucket: {
                      type: "string",
                    },
                    S3Key: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
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
        Encrypted: {
          name: "Encrypted",
          description:
            "Specifies whether the destination AMI of the imported image should be encrypted.",
          type: "boolean",
          required: false,
        },
        Hypervisor: {
          name: "Hypervisor",
          description: "The target hypervisor platform.",
          type: "string",
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "An identifier for the symmetric KMS key to use when creating the encrypted AMI.",
          type: "string",
          required: false,
        },
        LicenseType: {
          name: "License Type",
          description:
            "The license type to be used for the Amazon Machine Image (AMI) after importing.",
          type: "string",
          required: false,
        },
        Platform: {
          name: "Platform",
          description: "The operating system of the virtual machine.",
          type: "string",
          required: false,
        },
        RoleName: {
          name: "Role Name",
          description:
            "The name of the role to use when not using the default role, 'vmimport'.",
          type: "string",
          required: false,
        },
        LicenseSpecifications: {
          name: "License Specifications",
          description: "The ARNs of the license configurations.",
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
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The tags to apply to the import image task during creation.",
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
        UsageOperation: {
          name: "Usage Operation",
          description: "The usage operation value.",
          type: "string",
          required: false,
        },
        BootMode: {
          name: "Boot Mode",
          description: "The boot mode of the virtual machine.",
          type: "string",
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

        const command = new ImportImageCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Image Result",
      description: "Result from ImportImage operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Architecture: {
            type: "string",
            description: "The architecture of the virtual machine.",
          },
          Description: {
            type: "string",
            description: "A description of the import task.",
          },
          Encrypted: {
            type: "boolean",
            description: "Indicates whether the AMI is encrypted.",
          },
          Hypervisor: {
            type: "string",
            description: "The target hypervisor of the import task.",
          },
          ImageId: {
            type: "string",
            description:
              "The ID of the Amazon Machine Image (AMI) created by the import task.",
          },
          ImportTaskId: {
            type: "string",
            description: "The task ID of the import image task.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "The identifier for the symmetric KMS key that was used to create the encrypted AMI.",
          },
          LicenseType: {
            type: "string",
            description: "The license type of the virtual machine.",
          },
          Platform: {
            type: "string",
            description: "The operating system of the virtual machine.",
          },
          Progress: {
            type: "string",
            description: "The progress of the task.",
          },
          SnapshotDetails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Description: {
                  type: "string",
                },
                DeviceName: {
                  type: "string",
                },
                DiskImageSize: {
                  type: "number",
                },
                Format: {
                  type: "string",
                },
                Progress: {
                  type: "string",
                },
                SnapshotId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                Url: {
                  type: "string",
                },
                UserBucket: {
                  type: "object",
                  properties: {
                    S3Bucket: {
                      type: "string",
                    },
                    S3Key: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the snapshots.",
          },
          Status: {
            type: "string",
            description: "A brief status of the task.",
          },
          StatusMessage: {
            type: "string",
            description: "A detailed status message of the import task.",
          },
          LicenseSpecifications: {
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
            description: "The ARNs of the license configurations.",
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
            description: "Any tags assigned to the import image task.",
          },
          UsageOperation: {
            type: "string",
            description: "The usage operation value.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importImage;
