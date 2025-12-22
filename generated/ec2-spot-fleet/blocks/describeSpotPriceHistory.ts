import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeSpotPriceHistoryCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSpotPriceHistory: AppBlock = {
  name: "Describe Spot Price History",
  description: `Describes the Spot price history.`,
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
        StartTime: {
          name: "Start Time",
          description:
            "The date and time, up to the past 90 days, from which to start retrieving the price history data, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "The date and time, up to the current date, from which to stop retrieving the price history data, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).",
          type: "string",
          required: false,
        },
        InstanceTypes: {
          name: "Instance Types",
          description: "Filters the results by the specified instance types.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ProductDescriptions: {
          name: "Product Descriptions",
          description:
            "Filters the results by the specified basic product descriptions.",
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
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "Filters the results by the specified Availability Zone.",
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
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeSpotPriceHistoryCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Spot Price History Result",
      description: "Result from DescribeSpotPriceHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          SpotPriceHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZone: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                ProductDescription: {
                  type: "string",
                },
                SpotPrice: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The historical Spot prices.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSpotPriceHistory;
