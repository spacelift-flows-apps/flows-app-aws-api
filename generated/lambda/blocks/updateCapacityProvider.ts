import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  UpdateCapacityProviderCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCapacityProvider: AppBlock = {
  name: "Update Capacity Provider",
  description: `Updates the configuration of an existing capacity provider.`,
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
        CapacityProviderName: {
          name: "Capacity Provider Name",
          description: "The name of the capacity provider to update.",
          type: "string",
          required: true,
        },
        CapacityProviderScalingConfig: {
          name: "Capacity Provider Scaling Config",
          description:
            "The updated scaling configuration for the capacity provider.",
          type: {
            type: "object",
            properties: {
              MaxVCpuCount: {
                type: "number",
              },
              ScalingMode: {
                type: "string",
                enum: ["Auto", "Manual"],
              },
              ScalingPolicies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    PredefinedMetricType: {
                      type: "string",
                      enum: ["LambdaCapacityProviderAverageCPUUtilization"],
                    },
                    TargetValue: {
                      type: "number",
                    },
                  },
                  required: ["PredefinedMetricType", "TargetValue"],
                  additionalProperties: false,
                },
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateCapacityProviderCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Capacity Provider Result",
      description: "Result from UpdateCapacityProvider operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityProvider: {
            type: "object",
            properties: {
              CapacityProviderArn: {
                type: "string",
              },
              State: {
                type: "string",
                enum: ["Pending", "Active", "Failed", "Deleting"],
              },
              VpcConfig: {
                type: "object",
                properties: {
                  SubnetIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  SecurityGroupIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["SubnetIds", "SecurityGroupIds"],
                additionalProperties: false,
              },
              PermissionsConfig: {
                type: "object",
                properties: {
                  CapacityProviderOperatorRoleArn: {
                    type: "string",
                  },
                },
                required: ["CapacityProviderOperatorRoleArn"],
                additionalProperties: false,
              },
              InstanceRequirements: {
                type: "object",
                properties: {
                  Architectures: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["x86_64", "arm64"],
                    },
                  },
                  AllowedInstanceTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  ExcludedInstanceTypes: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              CapacityProviderScalingConfig: {
                type: "object",
                properties: {
                  MaxVCpuCount: {
                    type: "number",
                  },
                  ScalingMode: {
                    type: "string",
                    enum: ["Auto", "Manual"],
                  },
                  ScalingPolicies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "string",
                          enum: ["LambdaCapacityProviderAverageCPUUtilization"],
                        },
                        TargetValue: {
                          type: "number",
                        },
                      },
                      required: ["PredefinedMetricType", "TargetValue"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              KmsKeyArn: {
                type: "string",
              },
              LastModified: {
                type: "string",
              },
            },
            required: [
              "CapacityProviderArn",
              "State",
              "VpcConfig",
              "PermissionsConfig",
            ],
            additionalProperties: false,
            description: "Information about the updated capacity provider.",
          },
        },
        required: ["CapacityProvider"],
      },
    },
  },
};

export default updateCapacityProvider;
