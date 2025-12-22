import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  CreateCapacityReservationFleetCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCapacityReservationFleet: AppBlock = {
  name: "Create Capacity Reservation Fleet",
  description: `Creates a Capacity Reservation Fleet.`,
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
        AllocationStrategy: {
          name: "Allocation Strategy",
          description:
            "The strategy used by the Capacity Reservation Fleet to determine which of the specified instance types to use.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        InstanceTypeSpecifications: {
          name: "Instance Type Specifications",
          description:
            "Information about the instance types for which to reserve the capacity.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceType: {
                  type: "string",
                },
                InstancePlatform: {
                  type: "string",
                },
                Weight: {
                  type: "number",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                EbsOptimized: {
                  type: "boolean",
                },
                Priority: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        Tenancy: {
          name: "Tenancy",
          description:
            "Indicates the tenancy of the Capacity Reservation Fleet.",
          type: "string",
          required: false,
        },
        TotalTargetCapacity: {
          name: "Total Target Capacity",
          description:
            "The total number of capacity units to be reserved by the Capacity Reservation Fleet.",
          type: "number",
          required: true,
        },
        EndDate: {
          name: "End Date",
          description:
            "The date and time at which the Capacity Reservation Fleet expires.",
          type: "string",
          required: false,
        },
        InstanceMatchCriteria: {
          name: "Instance Match Criteria",
          description:
            "Indicates the type of instance launches that the Capacity Reservation Fleet accepts.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to assign to the Capacity Reservation Fleet.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateCapacityReservationFleetCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Capacity Reservation Fleet Result",
      description: "Result from CreateCapacityReservationFleet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityReservationFleetId: {
            type: "string",
            description: "The ID of the Capacity Reservation Fleet.",
          },
          State: {
            type: "string",
            description: "The status of the Capacity Reservation Fleet.",
          },
          TotalTargetCapacity: {
            type: "number",
            description:
              "The total number of capacity units for which the Capacity Reservation Fleet reserves capacity.",
          },
          TotalFulfilledCapacity: {
            type: "number",
            description:
              "The requested capacity units that have been successfully reserved.",
          },
          InstanceMatchCriteria: {
            type: "string",
            description:
              "The instance matching criteria for the Capacity Reservation Fleet.",
          },
          AllocationStrategy: {
            type: "string",
            description:
              "The allocation strategy used by the Capacity Reservation Fleet.",
          },
          CreateTime: {
            type: "string",
            description:
              "The date and time at which the Capacity Reservation Fleet was created.",
          },
          EndDate: {
            type: "string",
            description:
              "The date and time at which the Capacity Reservation Fleet expires.",
          },
          Tenancy: {
            type: "string",
            description: "Indicates the tenancy of Capacity Reservation Fleet.",
          },
          FleetCapacityReservations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CapacityReservationId: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                InstancePlatform: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                TotalInstanceCount: {
                  type: "number",
                },
                FulfilledCapacity: {
                  type: "number",
                },
                EbsOptimized: {
                  type: "boolean",
                },
                CreateDate: {
                  type: "string",
                },
                Weight: {
                  type: "number",
                },
                Priority: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the individual Capacity Reservations in the Capacity Reservation Fleet.",
          },
          Tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The tags assigned to the Capacity Reservation Fleet.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCapacityReservationFleet;
