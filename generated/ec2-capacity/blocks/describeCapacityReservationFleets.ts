import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeCapacityReservationFleetsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCapacityReservationFleets: AppBlock = {
  name: "Describe Capacity Reservation Fleets",
  description: `Describes one or more Capacity Reservation Fleets.`,
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
        CapacityReservationFleetIds: {
          name: "Capacity Reservation Fleet Ids",
          description:
            "The IDs of the Capacity Reservation Fleets to describe.",
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
          description: "The token to use to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "One or more filters.",
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeCapacityReservationFleetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Capacity Reservation Fleets Result",
      description: "Result from DescribeCapacityReservationFleets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityReservationFleets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CapacityReservationFleetId: {
                  type: "string",
                },
                CapacityReservationFleetArn: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                TotalTargetCapacity: {
                  type: "number",
                },
                TotalFulfilledCapacity: {
                  type: "number",
                },
                Tenancy: {
                  type: "string",
                },
                EndDate: {
                  type: "string",
                },
                CreateTime: {
                  type: "string",
                },
                InstanceMatchCriteria: {
                  type: "string",
                },
                AllocationStrategy: {
                  type: "string",
                },
                InstanceTypeSpecifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CapacityReservationId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AvailabilityZoneId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstancePlatform: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AvailabilityZone: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TotalInstanceCount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FulfilledCapacity: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EbsOptimized: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CreateDate: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Weight: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Priority: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
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
              },
              additionalProperties: false,
            },
            description: "Information about the Capacity Reservation Fleets.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use to retrieve the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCapacityReservationFleets;
