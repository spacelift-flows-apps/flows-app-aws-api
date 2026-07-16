import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECSClient,
  DescribeServiceRevisionsCommand,
} from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeServiceRevisions: AppBlock = {
  name: "Describe Service Revisions",
  description: `Describes one or more service revisions.`,
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
        serviceRevisionArns: {
          name: "service Revision Arns",
          description: "The ARN of the service revision.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeServiceRevisionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Service Revisions Result",
      description: "Result from DescribeServiceRevisions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          serviceRevisions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceRevisionArn: {
                  type: "string",
                },
                serviceArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                taskDefinition: {
                  type: "string",
                },
                capacityProviderStrategy: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      capacityProvider: {
                        type: "string",
                      },
                      weight: {
                        type: "number",
                      },
                      base: {
                        type: "number",
                      },
                    },
                    required: ["capacityProvider"],
                    additionalProperties: false,
                  },
                },
                launchType: {
                  type: "string",
                },
                platformVersion: {
                  type: "string",
                },
                platformFamily: {
                  type: "string",
                },
                loadBalancers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      targetGroupArn: {
                        type: "string",
                      },
                      loadBalancerName: {
                        type: "string",
                      },
                      containerName: {
                        type: "string",
                      },
                      containerPort: {
                        type: "number",
                      },
                      advancedConfiguration: {
                        type: "object",
                        properties: {
                          alternateTargetGroupArn: {},
                          productionListenerRule: {},
                          testListenerRule: {},
                          roleArn: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                serviceRegistries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      registryArn: {
                        type: "string",
                      },
                      port: {
                        type: "number",
                      },
                      containerName: {
                        type: "string",
                      },
                      containerPort: {
                        type: "number",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                networkConfiguration: {
                  type: "object",
                  properties: {
                    awsvpcConfiguration: {
                      type: "object",
                      properties: {
                        subnets: {
                          type: "array",
                          items: {},
                        },
                        securityGroups: {
                          type: "array",
                          items: {},
                        },
                        assignPublicIp: {
                          type: "string",
                        },
                      },
                      required: ["subnets"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                containerImages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerName: {
                        type: "string",
                      },
                      imageDigest: {
                        type: "string",
                      },
                      image: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                guardDutyEnabled: {
                  type: "boolean",
                },
                serviceConnectConfiguration: {
                  type: "object",
                  properties: {
                    enabled: {
                      type: "boolean",
                    },
                    namespace: {
                      type: "string",
                    },
                    services: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          portName: {},
                          discoveryName: {},
                          clientAliases: {},
                          ingressPortOverride: {},
                          timeout: {},
                          tls: {},
                        },
                        required: ["portName"],
                        additionalProperties: false,
                      },
                    },
                    logConfiguration: {
                      type: "object",
                      properties: {
                        logDriver: {
                          type: "string",
                        },
                        options: {
                          type: "object",
                          additionalProperties: {
                            type: "object",
                          },
                        },
                        secretOptions: {
                          type: "array",
                          items: {},
                        },
                      },
                      required: ["logDriver"],
                      additionalProperties: false,
                    },
                    accessLogConfiguration: {
                      type: "object",
                      properties: {
                        format: {
                          type: "string",
                        },
                        includeQueryParameters: {
                          type: "string",
                        },
                      },
                      required: ["format"],
                      additionalProperties: false,
                    },
                  },
                  required: ["enabled"],
                  additionalProperties: false,
                },
                volumeConfigurations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      managedEBSVolume: {
                        type: "object",
                        properties: {
                          encrypted: {},
                          kmsKeyId: {},
                          volumeType: {},
                          sizeInGiB: {},
                          snapshotId: {},
                          volumeInitializationRate: {},
                          iops: {},
                          throughput: {},
                          tagSpecifications: {},
                          roleArn: {},
                          filesystemType: {},
                        },
                        required: ["roleArn"],
                        additionalProperties: false,
                      },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
                fargateEphemeralStorage: {
                  type: "object",
                  properties: {
                    kmsKeyId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                createdAt: {
                  type: "string",
                },
                vpcLatticeConfigurations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      roleArn: {
                        type: "string",
                      },
                      targetGroupArn: {
                        type: "string",
                      },
                      portName: {
                        type: "string",
                      },
                    },
                    required: ["roleArn", "targetGroupArn", "portName"],
                    additionalProperties: false,
                  },
                },
                resolvedConfiguration: {
                  type: "object",
                  properties: {
                    loadBalancers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          targetGroupArn: {},
                          productionListenerRule: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                ecsManagedResources: {
                  type: "object",
                  properties: {
                    ingressPaths: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          accessType: {},
                          endpoint: {},
                          loadBalancer: {},
                          loadBalancerSecurityGroups: {},
                          certificate: {},
                          listener: {},
                          rule: {},
                          targetGroups: {},
                        },
                        required: ["accessType", "endpoint"],
                        additionalProperties: false,
                      },
                    },
                    autoScaling: {
                      type: "object",
                      properties: {
                        scalableTarget: {
                          type: "object",
                          properties: {
                            arn: {},
                            status: {},
                            statusReason: {},
                            updatedAt: {},
                            minCapacity: {},
                            maxCapacity: {},
                          },
                          required: [
                            "status",
                            "updatedAt",
                            "minCapacity",
                            "maxCapacity",
                          ],
                          additionalProperties: false,
                        },
                        applicationAutoScalingPolicies: {
                          type: "array",
                          items: {},
                        },
                      },
                      additionalProperties: false,
                    },
                    metricAlarms: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          arn: {},
                          status: {},
                          statusReason: {},
                          updatedAt: {},
                        },
                        required: ["status", "updatedAt"],
                        additionalProperties: false,
                      },
                    },
                    serviceSecurityGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          arn: {},
                          status: {},
                          statusReason: {},
                          updatedAt: {},
                        },
                        required: ["status", "updatedAt"],
                        additionalProperties: false,
                      },
                    },
                    logGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          arn: {},
                          status: {},
                          statusReason: {},
                          updatedAt: {},
                          logGroupName: {},
                        },
                        required: ["status", "updatedAt", "logGroupName"],
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "The list of service revisions described.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
                detail: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeServiceRevisions;
