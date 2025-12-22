import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeReservedDBInstancesCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeReservedDBInstances: AppBlock = {
  name: "Describe Reserved DB Instances",
  description: `Returns information about reserved DB instances for this account, or about a specified reserved DB instance.`,
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
        ReservedDBInstanceId: {
          name: "Reserved DB Instance Id",
          description: "The reserved DB instance identifier filter value.",
          type: "string",
          required: false,
        },
        ReservedDBInstancesOfferingId: {
          name: "Reserved DB Instances Offering Id",
          description: "The offering identifier filter value.",
          type: "string",
          required: false,
        },
        DBInstanceClass: {
          name: "DB Instance Class",
          description: "The DB instance class filter value.",
          type: "string",
          required: false,
        },
        Duration: {
          name: "Duration",
          description:
            "The duration filter value, specified in years or seconds.",
          type: "string",
          required: false,
        },
        ProductDescription: {
          name: "Product Description",
          description: "The product description filter value.",
          type: "string",
          required: false,
        },
        OfferingType: {
          name: "Offering Type",
          description: "The offering type filter value.",
          type: "string",
          required: false,
        },
        MultiAZ: {
          name: "Multi AZ",
          description:
            "Specifies whether to show only those reservations that support Multi-AZ.",
          type: "boolean",
          required: false,
        },
        LeaseId: {
          name: "Lease Id",
          description: "The lease identifier filter value.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter isn't currently supported.",
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
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeReservedDBInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Reserved DB Instances Result",
      description: "Result from DescribeReservedDBInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
          ReservedDBInstances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ReservedDBInstanceId: {
                  type: "string",
                },
                ReservedDBInstancesOfferingId: {
                  type: "string",
                },
                DBInstanceClass: {
                  type: "string",
                },
                StartTime: {
                  type: "string",
                },
                Duration: {
                  type: "number",
                },
                FixedPrice: {
                  type: "number",
                },
                UsagePrice: {
                  type: "number",
                },
                CurrencyCode: {
                  type: "string",
                },
                DBInstanceCount: {
                  type: "number",
                },
                ProductDescription: {
                  type: "string",
                },
                OfferingType: {
                  type: "string",
                },
                MultiAZ: {
                  type: "boolean",
                },
                State: {
                  type: "string",
                },
                RecurringCharges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      RecurringChargeAmount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RecurringChargeFrequency: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ReservedDBInstanceArn: {
                  type: "string",
                },
                LeaseId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of reserved DB instances.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeReservedDBInstances;
