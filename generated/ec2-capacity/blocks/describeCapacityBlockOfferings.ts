import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeCapacityBlockOfferingsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCapacityBlockOfferings: AppBlock = {
  name: "Describe Capacity Block Offerings",
  description: `Describes Capacity Block offerings available for purchase in the Amazon Web Services Region that you're currently using.`,
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
        InstanceType: {
          name: "Instance Type",
          description:
            "The type of instance for which the Capacity Block offering reserves capacity.",
          type: "string",
          required: false,
        },
        InstanceCount: {
          name: "Instance Count",
          description: "The number of instances for which to reserve capacity.",
          type: "number",
          required: false,
        },
        StartDateRange: {
          name: "Start Date Range",
          description:
            "The earliest start date for the Capacity Block offering.",
          type: "string",
          required: false,
        },
        EndDateRange: {
          name: "End Date Range",
          description: "The latest end date for the Capacity Block offering.",
          type: "string",
          required: false,
        },
        CapacityDurationHours: {
          name: "Capacity Duration Hours",
          description:
            "The reservation duration for the Capacity Block, in hours.",
          type: "number",
          required: true,
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
        UltraserverType: {
          name: "Ultraserver Type",
          description:
            "The EC2 UltraServer type of the Capacity Block offerings.",
          type: "string",
          required: false,
        },
        UltraserverCount: {
          name: "Ultraserver Count",
          description: "The number of EC2 UltraServers in the offerings.",
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

        const command = new DescribeCapacityBlockOfferingsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Capacity Block Offerings Result",
      description: "Result from DescribeCapacityBlockOfferings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityBlockOfferings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CapacityBlockOfferingId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                InstanceCount: {
                  type: "number",
                },
                StartDate: {
                  type: "string",
                },
                EndDate: {
                  type: "string",
                },
                CapacityBlockDurationHours: {
                  type: "number",
                },
                UpfrontFee: {
                  type: "string",
                },
                CurrencyCode: {
                  type: "string",
                },
                Tenancy: {
                  type: "string",
                },
                UltraserverType: {
                  type: "string",
                },
                UltraserverCount: {
                  type: "number",
                },
                CapacityBlockDurationMinutes: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "The recommended Capacity Block offering for the dates specified.",
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

export default describeCapacityBlockOfferings;
