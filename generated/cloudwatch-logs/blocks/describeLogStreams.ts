import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLogStreams: AppBlock = {
  name: "Describe Log Streams",
  description: `Lists the log streams for the specified log group.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: false,
        },
        logGroupIdentifier: {
          name: "log Group Identifier",
          description:
            "Specify either the name or ARN of the log group to view.",
          type: "string",
          required: false,
        },
        logStreamNamePrefix: {
          name: "log Stream Name Prefix",
          description: "The prefix to match.",
          type: "string",
          required: false,
        },
        orderBy: {
          name: "order By",
          description:
            "If the value is LogStreamName, the results are ordered by log stream name.",
          type: "string",
          required: false,
        },
        descending: {
          name: "descending",
          description:
            "If the value is true, results are returned in descending order.",
          type: "boolean",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description: "The maximum number of items returned.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeLogStreamsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Log Streams Result",
      description: "Result from DescribeLogStreams operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          logStreams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                logStreamName: {
                  type: "string",
                },
                creationTime: {
                  type: "number",
                },
                firstEventTimestamp: {
                  type: "number",
                },
                lastEventTimestamp: {
                  type: "number",
                },
                lastIngestionTime: {
                  type: "number",
                },
                uploadSequenceToken: {
                  type: "string",
                },
                arn: {
                  type: "string",
                },
                storedBytes: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The log streams.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLogStreams;
