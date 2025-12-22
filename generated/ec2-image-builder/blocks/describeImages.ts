import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeImagesCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImages: AppBlock = {
  name: "Describe Images",
  description: `Describes the specified images (AMIs, AKIs, and ARIs) available to you or all of the images available to you.`,
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
        ExecutableUsers: {
          name: "Executable Users",
          description:
            "Scopes the images by users with explicit launch permissions.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ImageIds: {
          name: "Image Ids",
          description: "The image IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Owners: {
          name: "Owners",
          description:
            "Scopes the results to images with the specified owners.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        IncludeDeprecated: {
          name: "Include Deprecated",
          description: "Specifies whether to include deprecated AMIs.",
          type: "boolean",
          required: false,
        },
        IncludeDisabled: {
          name: "Include Disabled",
          description: "Specifies whether to include disabled AMIs.",
          type: "boolean",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
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
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeImagesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Images Result",
      description: "Result from DescribeImages operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PlatformDetails: {
                  type: "string",
                },
                UsageOperation: {
                  type: "string",
                },
                BlockDeviceMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Ebs: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NoDevice: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DeviceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      VirtualName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Description: {
                  type: "string",
                },
                EnaSupport: {
                  type: "boolean",
                },
                Hypervisor: {
                  type: "string",
                },
                ImageOwnerAlias: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                RootDeviceName: {
                  type: "string",
                },
                RootDeviceType: {
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
                BootMode: {
                  type: "string",
                },
                TpmSupport: {
                  type: "string",
                },
                DeprecationTime: {
                  type: "string",
                },
                ImdsSupport: {
                  type: "string",
                },
                SourceInstanceId: {
                  type: "string",
                },
                DeregistrationProtection: {
                  type: "string",
                },
                LastLaunchedTime: {
                  type: "string",
                },
                ImageAllowed: {
                  type: "boolean",
                },
                SourceImageId: {
                  type: "string",
                },
                SourceImageRegion: {
                  type: "string",
                },
                FreeTierEligible: {
                  type: "boolean",
                },
                ImageId: {
                  type: "string",
                },
                ImageLocation: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                Public: {
                  type: "boolean",
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
                Architecture: {
                  type: "string",
                },
                ImageType: {
                  type: "string",
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
              },
              additionalProperties: false,
            },
            description: "Information about the images.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeImages;
