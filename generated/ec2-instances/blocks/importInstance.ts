import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ImportInstanceCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importInstance: AppBlock = {
  name: "Import Instance",
  description: `We recommend that you use the ImportImage API instead.`,
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
        Description: {
          name: "Description",
          description: "A description for the instance being imported.",
          type: "string",
          required: false,
        },
        LaunchSpecification: {
          name: "Launch Specification",
          description: "The launch specification.",
          type: {
            type: "object",
            properties: {
              Architecture: {
                type: "string",
              },
              GroupNames: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              GroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              AdditionalInfo: {
                type: "string",
              },
              UserData: {
                type: "object",
                properties: {
                  Data: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              InstanceType: {
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
              Monitoring: {
                type: "boolean",
              },
              SubnetId: {
                type: "string",
              },
              InstanceInitiatedShutdownBehavior: {
                type: "string",
              },
              PrivateIpAddress: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        DiskImages: {
          name: "Disk Images",
          description: "The disk image.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Description: {
                  type: "string",
                },
                Image: {
                  type: "object",
                  properties: {
                    Format: {
                      type: "string",
                    },
                    Bytes: {
                      type: "number",
                    },
                    ImportManifestUrl: {
                      type: "string",
                    },
                  },
                  required: ["Format", "Bytes", "ImportManifestUrl"],
                  additionalProperties: false,
                },
                Volume: {
                  type: "object",
                  properties: {
                    Size: {
                      type: "number",
                    },
                  },
                  required: ["Size"],
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Platform: {
          name: "Platform",
          description: "The instance operating system.",
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

        const command = new ImportInstanceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Instance Result",
      description: "Result from ImportInstance operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConversionTask: {
            type: "object",
            properties: {
              ConversionTaskId: {
                type: "string",
              },
              ExpirationTime: {
                type: "string",
              },
              ImportInstance: {
                type: "object",
                properties: {
                  Description: {
                    type: "string",
                  },
                  InstanceId: {
                    type: "string",
                  },
                  Platform: {
                    type: "string",
                  },
                  Volumes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        AvailabilityZone: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BytesConverted: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Description: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Image: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Status: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusMessage: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Volume: {
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
              ImportVolume: {
                type: "object",
                properties: {
                  AvailabilityZone: {
                    type: "string",
                  },
                  BytesConverted: {
                    type: "number",
                  },
                  Description: {
                    type: "string",
                  },
                  Image: {
                    type: "object",
                    properties: {
                      Checksum: {
                        type: "string",
                      },
                      Format: {
                        type: "string",
                      },
                      ImportManifestUrl: {
                        type: "string",
                      },
                      Size: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                  Volume: {
                    type: "object",
                    properties: {
                      Id: {
                        type: "string",
                      },
                      Size: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              State: {
                type: "string",
              },
              StatusMessage: {
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
            description: "Information about the conversion task.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importInstance;
