import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeFleetsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeFleets: AppBlock = {
  name: "Describe Fleets",
  description: `Describes the specified EC2 Fleet or all of your EC2 Fleets.`,
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
        FleetIds: {
          name: "Fleet Ids",
          description: "The IDs of the EC2 Fleets.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DescribeFleetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Fleets Result",
      description: "Result from DescribeFleets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          Fleets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActivityStatus: {
                  type: "string",
                },
                CreateTime: {
                  type: "string",
                },
                FleetId: {
                  type: "string",
                },
                FleetState: {
                  type: "string",
                },
                ClientToken: {
                  type: "string",
                },
                ExcessCapacityTerminationPolicy: {
                  type: "string",
                },
                FulfilledCapacity: {
                  type: "number",
                },
                FulfilledOnDemandCapacity: {
                  type: "number",
                },
                LaunchTemplateConfigs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      LaunchTemplateSpecification: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Overrides: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                TargetCapacitySpecification: {
                  type: "object",
                  properties: {
                    TotalTargetCapacity: {
                      type: "number",
                    },
                    OnDemandTargetCapacity: {
                      type: "number",
                    },
                    SpotTargetCapacity: {
                      type: "number",
                    },
                    DefaultTargetCapacityType: {
                      type: "string",
                    },
                    TargetCapacityUnitType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                TerminateInstancesWithExpiration: {
                  type: "boolean",
                },
                Type: {
                  type: "string",
                },
                ValidFrom: {
                  type: "string",
                },
                ValidUntil: {
                  type: "string",
                },
                ReplaceUnhealthyInstances: {
                  type: "boolean",
                },
                SpotOptions: {
                  type: "object",
                  properties: {
                    AllocationStrategy: {
                      type: "string",
                    },
                    MaintenanceStrategies: {
                      type: "object",
                      properties: {
                        CapacityRebalance: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    InstanceInterruptionBehavior: {
                      type: "string",
                    },
                    InstancePoolsToUseCount: {
                      type: "number",
                    },
                    SingleInstanceType: {
                      type: "boolean",
                    },
                    SingleAvailabilityZone: {
                      type: "boolean",
                    },
                    MinTargetCapacity: {
                      type: "number",
                    },
                    MaxTotalPrice: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                OnDemandOptions: {
                  type: "object",
                  properties: {
                    AllocationStrategy: {
                      type: "string",
                    },
                    CapacityReservationOptions: {
                      type: "object",
                      properties: {
                        UsageStrategy: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    SingleInstanceType: {
                      type: "boolean",
                    },
                    SingleAvailabilityZone: {
                      type: "boolean",
                    },
                    MinTargetCapacity: {
                      type: "number",
                    },
                    MaxTotalPrice: {
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
                Errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      LaunchTemplateAndOverrides: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Lifecycle: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ErrorCode: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ErrorMessage: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Instances: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      LaunchTemplateAndOverrides: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Lifecycle: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceIds: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Platform: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Context: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the EC2 Fleets.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeFleets;
