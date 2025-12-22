import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeReservedInstancesOfferingsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeReservedInstancesOfferings: AppBlock = {
  name: "Describe Reserved Instances Offerings",
  description: `Describes Reserved Instance offerings that are available for purchase.`,
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
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The Availability Zone in which the Reserved Instance can be used.",
          type: "string",
          required: false,
        },
        IncludeMarketplace: {
          name: "Include Marketplace",
          description:
            "Include Reserved Instance Marketplace offerings in the response.",
          type: "boolean",
          required: false,
        },
        InstanceType: {
          name: "Instance Type",
          description:
            "The instance type that the reservation will cover (for example, m1.",
          type: "string",
          required: false,
        },
        MaxDuration: {
          name: "Max Duration",
          description:
            "The maximum duration (in seconds) to filter when searching for offerings.",
          type: "number",
          required: false,
        },
        MaxInstanceCount: {
          name: "Max Instance Count",
          description:
            "The maximum number of instances to filter when searching for offerings.",
          type: "number",
          required: false,
        },
        MinDuration: {
          name: "Min Duration",
          description:
            "The minimum duration (in seconds) to filter when searching for offerings.",
          type: "number",
          required: false,
        },
        OfferingClass: {
          name: "Offering Class",
          description: "The offering class of the Reserved Instance.",
          type: "string",
          required: false,
        },
        ProductDescription: {
          name: "Product Description",
          description: "The Reserved Instance product platform description.",
          type: "string",
          required: false,
        },
        ReservedInstancesOfferingIds: {
          name: "Reserved Instances Offering Ids",
          description: "One or more Reserved Instances offering IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AvailabilityZoneId: {
          name: "Availability Zone Id",
          description: "The ID of the Availability Zone.",
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
        InstanceTenancy: {
          name: "Instance Tenancy",
          description:
            "The tenancy of the instances covered by the reservation.",
          type: "string",
          required: false,
        },
        OfferingType: {
          name: "Offering Type",
          description: "The Reserved Instance offering type.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return for the request in a single page.",
          type: "number",
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

        const command = new DescribeReservedInstancesOfferingsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Reserved Instances Offerings Result",
      description: "Result from DescribeReservedInstancesOfferings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to use to retrieve the next page of results.",
          },
          ReservedInstancesOfferings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CurrencyCode: {
                  type: "string",
                },
                InstanceTenancy: {
                  type: "string",
                },
                Marketplace: {
                  type: "boolean",
                },
                OfferingClass: {
                  type: "string",
                },
                OfferingType: {
                  type: "string",
                },
                PricingDetails: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Count: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Price: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                RecurringCharges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Amount: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Frequency: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Scope: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                ReservedInstancesOfferingId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                Duration: {
                  type: "number",
                },
                UsagePrice: {
                  type: "number",
                },
                FixedPrice: {
                  type: "number",
                },
                ProductDescription: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of Reserved Instances offerings.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeReservedInstancesOfferings;
