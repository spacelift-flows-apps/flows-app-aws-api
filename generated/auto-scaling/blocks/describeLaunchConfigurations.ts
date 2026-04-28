import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AutoScalingClient,
  DescribeLaunchConfigurationsCommand,
} from "@aws-sdk/client-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLaunchConfigurations: AppBlock = {
  name: "Describe Launch Configurations",
  description: `Gets information about the launch configurations in the account and Region.`,
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
        LaunchConfigurationNames: {
          name: "Launch Configuration Names",
          description: "The launch configuration names.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description: "The maximum number of items to return with this call.",
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

        const client = new AutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeLaunchConfigurationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Launch Configurations Result",
      description: "Result from DescribeLaunchConfigurations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LaunchConfigurations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LaunchConfigurationName: {
                  type: "string",
                },
                LaunchConfigurationARN: {
                  type: "string",
                },
                ImageId: {
                  type: "string",
                },
                KeyName: {
                  type: "string",
                },
                SecurityGroups: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ClassicLinkVPCId: {
                  type: "string",
                },
                ClassicLinkVPCSecurityGroups: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                UserData: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                KernelId: {
                  type: "string",
                },
                RamdiskId: {
                  type: "string",
                },
                BlockDeviceMappings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      VirtualName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DeviceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Ebs: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NoDevice: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["DeviceName"],
                    additionalProperties: false,
                  },
                },
                InstanceMonitoring: {
                  type: "object",
                  properties: {
                    Enabled: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                SpotPrice: {
                  type: "string",
                },
                IamInstanceProfile: {
                  type: "string",
                },
                CreatedTime: {
                  type: "string",
                },
                EbsOptimized: {
                  type: "boolean",
                },
                AssociatePublicIpAddress: {
                  type: "boolean",
                },
                PlacementTenancy: {
                  type: "string",
                },
                MetadataOptions: {
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
              },
              required: [
                "LaunchConfigurationName",
                "ImageId",
                "InstanceType",
                "CreatedTime",
              ],
              additionalProperties: false,
            },
            description: "The launch configurations.",
          },
          NextToken: {
            type: "string",
            description:
              "A string that indicates that the response contains more items than can be returned in a single response.",
          },
        },
        required: ["LaunchConfigurations"],
      },
    },
  },
};

export default describeLaunchConfigurations;
