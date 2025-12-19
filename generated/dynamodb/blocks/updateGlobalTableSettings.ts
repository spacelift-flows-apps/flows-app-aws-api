import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  UpdateGlobalTableSettingsCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateGlobalTableSettings: AppBlock = {
  name: "Update Global Table Settings",
  description: `Updates settings for a global table.`,
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
        GlobalTableName: {
          name: "Global Table Name",
          description: "The name of the global table",
          type: "string",
          required: true,
        },
        GlobalTableBillingMode: {
          name: "Global Table Billing Mode",
          description: "The billing mode of the global table.",
          type: "string",
          required: false,
        },
        GlobalTableProvisionedWriteCapacityUnits: {
          name: "Global Table Provisioned Write Capacity Units",
          description:
            "The maximum number of writes consumed per second before DynamoDB returns a ThrottlingException.",
          type: "number",
          required: false,
        },
        GlobalTableProvisionedWriteCapacityAutoScalingSettingsUpdate: {
          name: "Global Table Provisioned Write Capacity Auto Scaling Settings Update",
          description:
            "Auto scaling settings for managing provisioned write capacity for the global table.",
          type: {
            type: "object",
            properties: {
              MinimumUnits: {
                type: "number",
              },
              MaximumUnits: {
                type: "number",
              },
              AutoScalingDisabled: {
                type: "boolean",
              },
              AutoScalingRoleArn: {
                type: "string",
              },
              ScalingPolicyUpdate: {
                type: "object",
                properties: {
                  PolicyName: {
                    type: "string",
                  },
                  TargetTrackingScalingPolicyConfiguration: {
                    type: "object",
                    properties: {
                      DisableScaleIn: {
                        type: "boolean",
                      },
                      ScaleInCooldown: {
                        type: "number",
                      },
                      ScaleOutCooldown: {
                        type: "number",
                      },
                      TargetValue: {
                        type: "number",
                      },
                    },
                    required: ["TargetValue"],
                    additionalProperties: false,
                  },
                },
                required: ["TargetTrackingScalingPolicyConfiguration"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        GlobalTableGlobalSecondaryIndexSettingsUpdate: {
          name: "Global Table Global Secondary Index Settings Update",
          description:
            "Represents the settings of a global secondary index for a global table that will be modified.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                IndexName: {
                  type: "string",
                },
                ProvisionedWriteCapacityUnits: {
                  type: "number",
                },
                ProvisionedWriteCapacityAutoScalingSettingsUpdate: {
                  type: "object",
                  properties: {
                    MinimumUnits: {
                      type: "number",
                    },
                    MaximumUnits: {
                      type: "number",
                    },
                    AutoScalingDisabled: {
                      type: "boolean",
                    },
                    AutoScalingRoleArn: {
                      type: "string",
                    },
                    ScalingPolicyUpdate: {
                      type: "object",
                      properties: {
                        PolicyName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetTrackingScalingPolicyConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["TargetTrackingScalingPolicyConfiguration"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["IndexName"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        ReplicaSettingsUpdate: {
          name: "Replica Settings Update",
          description:
            "Represents the settings for a global table in a Region that will be modified.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RegionName: {
                  type: "string",
                },
                ReplicaProvisionedReadCapacityUnits: {
                  type: "number",
                },
                ReplicaProvisionedReadCapacityAutoScalingSettingsUpdate: {
                  type: "object",
                  properties: {
                    MinimumUnits: {
                      type: "number",
                    },
                    MaximumUnits: {
                      type: "number",
                    },
                    AutoScalingDisabled: {
                      type: "boolean",
                    },
                    AutoScalingRoleArn: {
                      type: "string",
                    },
                    ScalingPolicyUpdate: {
                      type: "object",
                      properties: {
                        PolicyName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetTrackingScalingPolicyConfiguration: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["TargetTrackingScalingPolicyConfiguration"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                ReplicaGlobalSecondaryIndexSettingsUpdate: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IndexName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedReadCapacityUnits: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedReadCapacityAutoScalingSettingsUpdate: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["IndexName"],
                    additionalProperties: false,
                  },
                },
                ReplicaTableClass: {
                  type: "string",
                },
              },
              required: ["RegionName"],
              additionalProperties: false,
            },
          },
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateGlobalTableSettingsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Global Table Settings Result",
      description: "Result from UpdateGlobalTableSettings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GlobalTableName: {
            type: "string",
            description: "The name of the global table.",
          },
          ReplicaSettings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RegionName: {
                  type: "string",
                },
                ReplicaStatus: {
                  type: "string",
                },
                ReplicaBillingModeSummary: {
                  type: "object",
                  properties: {
                    BillingMode: {
                      type: "string",
                    },
                    LastUpdateToPayPerRequestDateTime: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                ReplicaProvisionedReadCapacityUnits: {
                  type: "number",
                },
                ReplicaProvisionedReadCapacityAutoScalingSettings: {
                  type: "object",
                  properties: {
                    MinimumUnits: {
                      type: "number",
                    },
                    MaximumUnits: {
                      type: "number",
                    },
                    AutoScalingDisabled: {
                      type: "boolean",
                    },
                    AutoScalingRoleArn: {
                      type: "string",
                    },
                    ScalingPolicies: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                ReplicaProvisionedWriteCapacityUnits: {
                  type: "number",
                },
                ReplicaProvisionedWriteCapacityAutoScalingSettings: {
                  type: "object",
                  properties: {
                    MinimumUnits: {
                      type: "number",
                    },
                    MaximumUnits: {
                      type: "number",
                    },
                    AutoScalingDisabled: {
                      type: "boolean",
                    },
                    AutoScalingRoleArn: {
                      type: "string",
                    },
                    ScalingPolicies: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                ReplicaGlobalSecondaryIndexSettings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IndexName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IndexStatus: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedReadCapacityUnits: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedReadCapacityAutoScalingSettings: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedWriteCapacityUnits: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProvisionedWriteCapacityAutoScalingSettings: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["IndexName"],
                    additionalProperties: false,
                  },
                },
                ReplicaTableClassSummary: {
                  type: "object",
                  properties: {
                    TableClass: {
                      type: "string",
                    },
                    LastUpdateDateTime: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["RegionName"],
              additionalProperties: false,
            },
            description: "The Region-specific settings for the global table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateGlobalTableSettings;
