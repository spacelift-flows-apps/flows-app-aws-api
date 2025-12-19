import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListInsightsMetricDataCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listInsightsMetricData: AppBlock = {
  name: "List Insights Metric Data",
  description: `Returns Insights metrics data for trails that have enabled Insights.`,
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
        EventSource: {
          name: "Event Source",
          description:
            "The Amazon Web Services service to which the request was made, such as iam.",
          type: "string",
          required: true,
        },
        EventName: {
          name: "Event Name",
          description:
            "The name of the event, typically the Amazon Web Services API on which unusual levels of activity were recorded.",
          type: "string",
          required: true,
        },
        InsightType: {
          name: "Insight Type",
          description:
            "The type of CloudTrail Insights event, which is either ApiCallRateInsight or ApiErrorRateInsight.",
          type: "string",
          required: true,
        },
        ErrorCode: {
          name: "Error Code",
          description:
            "Conditionally required if the InsightType parameter is set to ApiErrorRateInsight.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "Specifies, in UTC, the start time for time-series data.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description: "Specifies, in UTC, the end time for time-series data.",
          type: "string",
          required: false,
        },
        Period: {
          name: "Period",
          description: "Granularity of data to retrieve, in seconds.",
          type: "number",
          required: false,
        },
        DataType: {
          name: "Data Type",
          description: "Type of data points to return.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of data points to return.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Returned if all datapoints can't be returned in a single call.",
          type: "string",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListInsightsMetricDataCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Insights Metric Data Result",
      description: "Result from ListInsightsMetricData operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventSource: {
            type: "string",
            description:
              "The Amazon Web Services service to which the request was made, such as iam.",
          },
          EventName: {
            type: "string",
            description:
              "The name of the event, typically the Amazon Web Services API on which unusual levels of activity were recorded.",
          },
          InsightType: {
            type: "string",
            description:
              "The type of CloudTrail Insights event, which is either ApiCallRateInsight or ApiErrorRateInsight.",
          },
          ErrorCode: {
            type: "string",
            description:
              "Only returned if InsightType parameter was set to ApiErrorRateInsight.",
          },
          Timestamps: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of timestamps at intervals corresponding to the specified time period.",
          },
          Values: {
            type: "array",
            items: {
              type: "number",
            },
            description:
              "List of values representing the API call rate or error rate at each timestamp.",
          },
          NextToken: {
            type: "string",
            description:
              "Only returned if the full results could not be returned in a single query.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listInsightsMetricData;
