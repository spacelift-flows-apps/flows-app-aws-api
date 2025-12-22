import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, PurchaseCapacityBlockCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const purchaseCapacityBlock: AppBlock = {
  name: "Purchase Capacity Block",
  description: `Purchase the Capacity Block for use with your account.`,
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
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the Capacity Block during launch.",
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
        CapacityBlockOfferingId: {
          name: "Capacity Block Offering Id",
          description: "The ID of the Capacity Block offering.",
          type: "string",
          required: true,
        },
        InstancePlatform: {
          name: "Instance Platform",
          description:
            "The type of operating system for which to reserve capacity.",
          type: "string",
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

        const command = new PurchaseCapacityBlockCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Purchase Capacity Block Result",
      description: "Result from PurchaseCapacityBlock operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityReservation: {
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
              },
              AvailabilityZone: {
                type: "string",
              },
              Tenancy: {
                type: "string",
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
              },
              StartDate: {
                type: "string",
              },
              EndDate: {
                type: "string",
              },
              EndDateType: {
                type: "string",
              },
              InstanceMatchCriteria: {
                type: "string",
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
                    },
                    Count: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ReservationType: {
                type: "string",
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
              },
              CapacityBlockId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The Capacity Reservation.",
          },
          CapacityBlocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CapacityBlockId: {
                  type: "string",
                },
                UltraserverType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                CapacityReservationIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                StartDate: {
                  type: "string",
                },
                EndDate: {
                  type: "string",
                },
                CreateDate: {
                  type: "string",
                },
                State: {
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
            description: "The Capacity Block.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default purchaseCapacityBlock;
