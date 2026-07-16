import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ApplicationAutoScalingClient,
  DescribeScalingPoliciesCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScalingPolicies: AppBlock = {
  name: "Describe Scaling Policies",
  description: `Describes the Application Auto Scaling scaling policies for the specified service namespace.`,
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
        PolicyNames: {
          name: "Policy Names",
          description: "The names of the scaling policies to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ServiceNamespace: {
          name: "Service Namespace",
          description:
            "The namespace of the Amazon Web Services service that provides the resource.",
          type: {
            type: "string",
            enum: [
              "ecs",
              "elasticmapreduce",
              "ec2",
              "appstream",
              "dynamodb",
              "rds",
              "sagemaker",
              "custom-resource",
              "comprehend",
              "lambda",
              "cassandra",
              "kafka",
              "elasticache",
              "neptune",
              "workspaces",
            ],
          },
          required: true,
        },
        ResourceId: {
          name: "Resource Id",
          description:
            "The identifier of the resource associated with the scaling policy.",
          type: "string",
          required: false,
        },
        ScalableDimension: {
          name: "Scalable Dimension",
          description: "The scalable dimension.",
          type: {
            type: "string",
            enum: [
              "ecs:service:DesiredCount",
              "ec2:spot-fleet-request:TargetCapacity",
              "elasticmapreduce:instancegroup:InstanceCount",
              "appstream:fleet:DesiredCapacity",
              "dynamodb:table:ReadCapacityUnits",
              "dynamodb:table:WriteCapacityUnits",
              "dynamodb:index:ReadCapacityUnits",
              "dynamodb:index:WriteCapacityUnits",
              "rds:cluster:ReadReplicaCount",
              "sagemaker:variant:DesiredInstanceCount",
              "custom-resource:ResourceType:Property",
              "comprehend:document-classifier-endpoint:DesiredInferenceUnits",
              "comprehend:entity-recognizer-endpoint:DesiredInferenceUnits",
              "lambda:function:ProvisionedConcurrency",
              "cassandra:table:ReadCapacityUnits",
              "cassandra:table:WriteCapacityUnits",
              "kafka:broker-storage:VolumeSize",
              "elasticache:cache-cluster:Nodes",
              "elasticache:replication-group:NodeGroups",
              "elasticache:replication-group:Replicas",
              "neptune:cluster:ReadReplicaCount",
              "sagemaker:variant:DesiredProvisionedConcurrency",
              "sagemaker:inference-component:DesiredCopyCount",
              "workspaces:workspacespool:DesiredUserSessions",
            ],
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of scalable targets.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of results.",
          type: "string",
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

        const client = new ApplicationAutoScalingClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScalingPoliciesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scaling Policies Result",
      description: "Result from DescribeScalingPolicies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScalingPolicies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PolicyARN: {
                  type: "string",
                },
                PolicyName: {
                  type: "string",
                },
                ServiceNamespace: {
                  type: "string",
                  enum: [
                    "ecs",
                    "elasticmapreduce",
                    "ec2",
                    "appstream",
                    "dynamodb",
                    "rds",
                    "sagemaker",
                    "custom-resource",
                    "comprehend",
                    "lambda",
                    "cassandra",
                    "kafka",
                    "elasticache",
                    "neptune",
                    "workspaces",
                  ],
                },
                ResourceId: {
                  type: "string",
                },
                ScalableDimension: {
                  type: "string",
                  enum: [
                    "ecs:service:DesiredCount",
                    "ec2:spot-fleet-request:TargetCapacity",
                    "elasticmapreduce:instancegroup:InstanceCount",
                    "appstream:fleet:DesiredCapacity",
                    "dynamodb:table:ReadCapacityUnits",
                    "dynamodb:table:WriteCapacityUnits",
                    "dynamodb:index:ReadCapacityUnits",
                    "dynamodb:index:WriteCapacityUnits",
                    "rds:cluster:ReadReplicaCount",
                    "sagemaker:variant:DesiredInstanceCount",
                    "custom-resource:ResourceType:Property",
                    "comprehend:document-classifier-endpoint:DesiredInferenceUnits",
                    "comprehend:entity-recognizer-endpoint:DesiredInferenceUnits",
                    "lambda:function:ProvisionedConcurrency",
                    "cassandra:table:ReadCapacityUnits",
                    "cassandra:table:WriteCapacityUnits",
                    "kafka:broker-storage:VolumeSize",
                    "elasticache:cache-cluster:Nodes",
                    "elasticache:replication-group:NodeGroups",
                    "elasticache:replication-group:Replicas",
                    "neptune:cluster:ReadReplicaCount",
                    "sagemaker:variant:DesiredProvisionedConcurrency",
                    "sagemaker:inference-component:DesiredCopyCount",
                    "workspaces:workspacespool:DesiredUserSessions",
                  ],
                },
                PolicyType: {
                  type: "string",
                  enum: [
                    "StepScaling",
                    "TargetTrackingScaling",
                    "PredictiveScaling",
                  ],
                },
                StepScalingPolicyConfiguration: {
                  type: "object",
                  properties: {
                    AdjustmentType: {
                      type: "string",
                      enum: [
                        "ChangeInCapacity",
                        "PercentChangeInCapacity",
                        "ExactCapacity",
                      ],
                    },
                    StepAdjustments: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          MetricIntervalLowerBound: {},
                          MetricIntervalUpperBound: {},
                          ScalingAdjustment: {},
                        },
                        required: ["ScalingAdjustment"],
                        additionalProperties: false,
                      },
                    },
                    MinAdjustmentMagnitude: {
                      type: "number",
                    },
                    Cooldown: {
                      type: "number",
                    },
                    MetricAggregationType: {
                      type: "string",
                      enum: ["Average", "Minimum", "Maximum"],
                    },
                  },
                  additionalProperties: false,
                },
                TargetTrackingScalingPolicyConfiguration: {
                  type: "object",
                  properties: {
                    TargetValue: {
                      type: "number",
                    },
                    PredefinedMetricSpecification: {
                      type: "object",
                      properties: {
                        PredefinedMetricType: {
                          type: "string",
                          enum: [
                            "DynamoDBReadCapacityUtilization",
                            "DynamoDBWriteCapacityUtilization",
                            "ALBRequestCountPerTarget",
                            "RDSReaderAverageCPUUtilization",
                            "RDSReaderAverageDatabaseConnections",
                            "EC2SpotFleetRequestAverageCPUUtilization",
                            "EC2SpotFleetRequestAverageNetworkIn",
                            "EC2SpotFleetRequestAverageNetworkOut",
                            "SageMakerVariantInvocationsPerInstance",
                            "ECSServiceAverageCPUUtilization",
                            "ECSServiceAverageMemoryUtilization",
                            "AppStreamAverageCapacityUtilization",
                            "ComprehendInferenceUtilization",
                            "LambdaProvisionedConcurrencyUtilization",
                            "CassandraReadCapacityUtilization",
                            "CassandraWriteCapacityUtilization",
                            "KafkaBrokerStorageUtilization",
                            "ElastiCacheEngineCPUUtilization",
                            "ElastiCacheDatabaseMemoryUsagePercentage",
                            "ElastiCachePrimaryEngineCPUUtilization",
                            "ElastiCacheReplicaEngineCPUUtilization",
                            "ElastiCacheDatabaseMemoryUsageCountedForEvictPercentage",
                            "NeptuneReaderAverageCPUUtilization",
                            "SageMakerVariantProvisionedConcurrencyUtilization",
                            "ElastiCacheDatabaseCapacityUsageCountedForEvictPercentage",
                            "SageMakerInferenceComponentInvocationsPerCopy",
                            "WorkSpacesAverageUserSessionsCapacityUtilization",
                            "SageMakerInferenceComponentConcurrentRequestsPerCopyHighResolution",
                            "SageMakerVariantConcurrentRequestsPerModelHighResolution",
                          ],
                        },
                        ResourceLabel: {
                          type: "string",
                        },
                      },
                      required: ["PredefinedMetricType"],
                      additionalProperties: false,
                    },
                    CustomizedMetricSpecification: {
                      type: "object",
                      properties: {
                        MetricName: {
                          type: "string",
                        },
                        Namespace: {
                          type: "string",
                        },
                        Dimensions: {
                          type: "array",
                          items: {},
                        },
                        Statistic: {
                          type: "string",
                          enum: [
                            "Average",
                            "Minimum",
                            "Maximum",
                            "SampleCount",
                            "Sum",
                          ],
                        },
                        Unit: {
                          type: "string",
                        },
                        Metrics: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                    ScaleOutCooldown: {
                      type: "number",
                    },
                    ScaleInCooldown: {
                      type: "number",
                    },
                    DisableScaleIn: {
                      type: "boolean",
                    },
                  },
                  required: ["TargetValue"],
                  additionalProperties: false,
                },
                PredictiveScalingPolicyConfiguration: {
                  type: "object",
                  properties: {
                    MetricSpecifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          TargetValue: {},
                          PredefinedMetricPairSpecification: {},
                          PredefinedScalingMetricSpecification: {},
                          PredefinedLoadMetricSpecification: {},
                          CustomizedScalingMetricSpecification: {},
                          CustomizedLoadMetricSpecification: {},
                          CustomizedCapacityMetricSpecification: {},
                        },
                        required: ["TargetValue"],
                        additionalProperties: false,
                      },
                    },
                    Mode: {
                      type: "string",
                      enum: ["ForecastOnly", "ForecastAndScale"],
                    },
                    SchedulingBufferTime: {
                      type: "number",
                    },
                    MaxCapacityBreachBehavior: {
                      type: "string",
                      enum: ["HonorMaxCapacity", "IncreaseMaxCapacity"],
                    },
                    MaxCapacityBuffer: {
                      type: "number",
                    },
                  },
                  required: ["MetricSpecifications"],
                  additionalProperties: false,
                },
                Alarms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      AlarmName: {
                        type: "string",
                      },
                      AlarmARN: {
                        type: "string",
                      },
                    },
                    required: ["AlarmName", "AlarmARN"],
                    additionalProperties: false,
                  },
                },
                CreationTime: {
                  type: "string",
                },
              },
              required: [
                "PolicyARN",
                "PolicyName",
                "ServiceNamespace",
                "ResourceId",
                "ScalableDimension",
                "PolicyType",
                "CreationTime",
              ],
              additionalProperties: false,
            },
            description: "Information about the scaling policies.",
          },
          NextToken: {
            type: "string",
            description: "The token required to get the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScalingPolicies;
