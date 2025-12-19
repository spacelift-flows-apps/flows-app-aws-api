import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  DescribeTableReplicaAutoScalingCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTableReplicaAutoScaling: AppBlock = {
  name: "Describe Table Replica Auto Scaling",
  description: `Describes auto scaling settings across replicas of the global table at once.`,
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
        TableName: {
          name: "Table Name",
          description: "The name of the table.",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeTableReplicaAutoScalingCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Table Replica Auto Scaling Result",
      description: "Result from DescribeTableReplicaAutoScaling operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableAutoScalingDescription: {
            type: "object",
            properties: {
              TableName: {
                type: "string",
              },
              TableStatus: {
                type: "string",
              },
              Replicas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    RegionName: {
                      type: "string",
                    },
                    GlobalSecondaryIndexes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ReplicaProvisionedReadCapacityAutoScalingSettings: {
                      type: "object",
                      properties: {
                        MinimumUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaximumUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AutoScalingDisabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AutoScalingRoleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ScalingPolicies: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ReplicaProvisionedWriteCapacityAutoScalingSettings: {
                      type: "object",
                      properties: {
                        MinimumUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaximumUnits: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AutoScalingDisabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AutoScalingRoleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ScalingPolicies: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ReplicaStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "Represents the auto scaling properties of the table.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTableReplicaAutoScaling;
