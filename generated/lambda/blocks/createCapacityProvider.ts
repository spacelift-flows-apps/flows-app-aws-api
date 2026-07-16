import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  CreateCapacityProviderCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCapacityProvider: AppBlock = {
  name: "Create Capacity Provider",
  description: `Creates a capacity provider that manages compute resources for Lambda functions`,
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
          description: "The name of the capacity provider.",
          type: "string",
          required: true,
        },
        VpcConfig: {
          name: "Vpc Config",
          description:
            "The VPC configuration for the capacity provider, including subnet IDs and security group IDs where compute instances will be launched.",
          type: {
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
          required: true,
        },
        PermissionsConfig: {
          name: "Permissions Config",
          description:
            "The permissions configuration that specifies the IAM role ARN used by the capacity provider to manage compute resources.",
          type: {
            type: "object",
            properties: {
              CapacityProviderOperatorRoleArn: {
                type: "string",
              },
            },
            required: ["CapacityProviderOperatorRoleArn"],
            additionalProperties: false,
          },
          required: true,
        },
        InstanceRequirements: {
          name: "Instance Requirements",
          description:
            "The instance requirements that specify the compute instance characteristics, including architectures and allowed or excluded instance types.",
          type: {
            type: "object",
            properties: {
              Architectures: {
                type: "array",
                items: {
                  type: "string",
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
          required: false,
        },
        CapacityProviderScalingConfig: {
          name: "Capacity Provider Scaling Config",
          description:
            "The scaling configuration that defines how the capacity provider scales compute instances, including maximum vCPU count and scaling policies.",
          type: {
            type: "object",
            properties: {
              MaxVCpuCount: {
                type: "number",
              },
              ScalingMode: {
                type: "string",
              },
              ScalingPolicies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    PredefinedMetricType: {
                      type: "string",
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
        KmsKeyArn: {
          name: "Kms Key Arn",
          description:
            "The ARN of the KMS key used to encrypt data associated with the capacity provider.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags to associate with the capacity provider.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
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

        const command = new CreateCapacityProviderCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Capacity Provider Result",
      description: "Result from CreateCapacityProvider operation",
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
                  },
                  ScalingPolicies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "string",
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
            description:
              "Information about the capacity provider that was created.",
          },
        },
        required: ["CapacityProvider"],
      },
    },
  },
};

export default createCapacityProvider;
