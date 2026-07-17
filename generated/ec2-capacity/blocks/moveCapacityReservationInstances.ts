import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  MoveCapacityReservationInstancesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const moveCapacityReservationInstances: AppBlock = {
  name: "Move Capacity Reservation Instances",
  description: `Move available capacity from a source Capacity Reservation to a destination Capacity Reservation.`,
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
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        SourceCapacityReservationId: {
          name: "Source Capacity Reservation Id",
          description:
            "The ID of the Capacity Reservation from which you want to move capacity.",
          type: "string",
          required: true,
        },
        DestinationCapacityReservationId: {
          name: "Destination Capacity Reservation Id",
          description:
            "The ID of the Capacity Reservation that you want to move capacity into.",
          type: "string",
          required: true,
        },
        InstanceCount: {
          name: "Instance Count",
          description:
            "The number of instances that you want to move from the source Capacity Reservation.",
          type: "number",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new MoveCapacityReservationInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Move Capacity Reservation Instances Result",
      description: "Result from MoveCapacityReservationInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SourceCapacityReservation: {
            type: "object",
            properties: {
              CapacityReservationId: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              CapacityReservationArn: {
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
                enum: [
                  "Linux/UNIX",
                  "Red Hat Enterprise Linux",
                  "SUSE Linux",
                  "Windows",
                  "Windows with SQL Server",
                  "Windows with SQL Server Enterprise",
                  "Windows with SQL Server Standard",
                  "Windows with SQL Server Web",
                  "Linux with SQL Server Standard",
                  "Linux with SQL Server Web",
                  "Linux with SQL Server Enterprise",
                  "RHEL with SQL Server Standard",
                  "RHEL with SQL Server Enterprise",
                  "RHEL with SQL Server Web",
                  "RHEL with HA",
                  "RHEL with HA and SQL Server Standard",
                  "RHEL with HA and SQL Server Enterprise",
                  "Ubuntu Pro",
                ],
              },
              AvailabilityZone: {
                type: "string",
              },
              Tenancy: {
                type: "string",
                enum: ["default", "dedicated"],
              },
              TotalInstanceCount: {
                type: "number",
              },
              AvailableInstanceCount: {
                type: "number",
              },
              EbsOptimized: {
                type: "boolean",
              },
              EphemeralStorage: {
                type: "boolean",
              },
              State: {
                type: "string",
                enum: [
                  "active",
                  "expired",
                  "cancelled",
                  "pending",
                  "failed",
                  "scheduled",
                  "payment-pending",
                  "payment-failed",
                  "assessing",
                  "delayed",
                  "unsupported",
                  "unavailable",
                ],
              },
              StartDate: {
                type: "string",
              },
              EndDate: {
                type: "string",
              },
              EndDateType: {
                type: "string",
                enum: ["unlimited", "limited"],
              },
              InstanceMatchCriteria: {
                type: "string",
                enum: ["open", "targeted"],
              },
              CreateDate: {
                type: "string",
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
              },
              OutpostArn: {
                type: "string",
              },
              CapacityReservationFleetId: {
                type: "string",
              },
              PlacementGroupArn: {
                type: "string",
              },
              CapacityAllocations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AllocationType: {
                      type: "string",
                      enum: ["used", "future"],
                    },
                    Count: {
                      type: "number",
                    },
                    AllocationMetadata: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Key: {},
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ReservationType: {
                type: "string",
                enum: ["default", "capacity-block"],
              },
              UnusedReservationBillingOwnerId: {
                type: "string",
              },
              CommitmentInfo: {
                type: "object",
                properties: {
                  CommittedInstanceCount: {
                    type: "number",
                  },
                  CommitmentEndDate: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DeliveryPreference: {
                type: "string",
                enum: ["fixed", "incremental"],
              },
              CapacityBlockId: {
                type: "string",
              },
              Interruptible: {
                type: "boolean",
              },
              InterruptibleCapacityAllocation: {
                type: "object",
                properties: {
                  InstanceCount: {
                    type: "number",
                  },
                  TargetInstanceCount: {
                    type: "number",
                  },
                  Status: {
                    type: "string",
                    enum: [
                      "pending",
                      "active",
                      "updating",
                      "canceling",
                      "canceled",
                      "failed",
                    ],
                  },
                  InterruptibleCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
              InterruptionInfo: {
                type: "object",
                properties: {
                  SourceCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "Information about the source Capacity Reservation.",
          },
          DestinationCapacityReservation: {
            type: "object",
            properties: {
              CapacityReservationId: {
                type: "string",
              },
              OwnerId: {
                type: "string",
              },
              CapacityReservationArn: {
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
                enum: [
                  "Linux/UNIX",
                  "Red Hat Enterprise Linux",
                  "SUSE Linux",
                  "Windows",
                  "Windows with SQL Server",
                  "Windows with SQL Server Enterprise",
                  "Windows with SQL Server Standard",
                  "Windows with SQL Server Web",
                  "Linux with SQL Server Standard",
                  "Linux with SQL Server Web",
                  "Linux with SQL Server Enterprise",
                  "RHEL with SQL Server Standard",
                  "RHEL with SQL Server Enterprise",
                  "RHEL with SQL Server Web",
                  "RHEL with HA",
                  "RHEL with HA and SQL Server Standard",
                  "RHEL with HA and SQL Server Enterprise",
                  "Ubuntu Pro",
                ],
              },
              AvailabilityZone: {
                type: "string",
              },
              Tenancy: {
                type: "string",
                enum: ["default", "dedicated"],
              },
              TotalInstanceCount: {
                type: "number",
              },
              AvailableInstanceCount: {
                type: "number",
              },
              EbsOptimized: {
                type: "boolean",
              },
              EphemeralStorage: {
                type: "boolean",
              },
              State: {
                type: "string",
                enum: [
                  "active",
                  "expired",
                  "cancelled",
                  "pending",
                  "failed",
                  "scheduled",
                  "payment-pending",
                  "payment-failed",
                  "assessing",
                  "delayed",
                  "unsupported",
                  "unavailable",
                ],
              },
              StartDate: {
                type: "string",
              },
              EndDate: {
                type: "string",
              },
              EndDateType: {
                type: "string",
                enum: ["unlimited", "limited"],
              },
              InstanceMatchCriteria: {
                type: "string",
                enum: ["open", "targeted"],
              },
              CreateDate: {
                type: "string",
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
              },
              OutpostArn: {
                type: "string",
              },
              CapacityReservationFleetId: {
                type: "string",
              },
              PlacementGroupArn: {
                type: "string",
              },
              CapacityAllocations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AllocationType: {
                      type: "string",
                      enum: ["used", "future"],
                    },
                    Count: {
                      type: "number",
                    },
                    AllocationMetadata: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Key: {},
                          Value: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ReservationType: {
                type: "string",
                enum: ["default", "capacity-block"],
              },
              UnusedReservationBillingOwnerId: {
                type: "string",
              },
              CommitmentInfo: {
                type: "object",
                properties: {
                  CommittedInstanceCount: {
                    type: "number",
                  },
                  CommitmentEndDate: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DeliveryPreference: {
                type: "string",
                enum: ["fixed", "incremental"],
              },
              CapacityBlockId: {
                type: "string",
              },
              Interruptible: {
                type: "boolean",
              },
              InterruptibleCapacityAllocation: {
                type: "object",
                properties: {
                  InstanceCount: {
                    type: "number",
                  },
                  TargetInstanceCount: {
                    type: "number",
                  },
                  Status: {
                    type: "string",
                    enum: [
                      "pending",
                      "active",
                      "updating",
                      "canceling",
                      "canceled",
                      "failed",
                    ],
                  },
                  InterruptibleCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
              InterruptionInfo: {
                type: "object",
                properties: {
                  SourceCapacityReservationId: {
                    type: "string",
                  },
                  InterruptionType: {
                    type: "string",
                    enum: ["adhoc"],
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "Information about the destination Capacity Reservation.",
          },
          InstanceCount: {
            type: "number",
            description:
              "The number of instances that were moved from the source Capacity Reservation to the destination Capacity Reservation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default moveCapacityReservationInstances;
