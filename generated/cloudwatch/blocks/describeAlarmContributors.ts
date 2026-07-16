import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchClient,
  DescribeAlarmContributorsCommand,
} from "@aws-sdk/client-cloudwatch";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAlarmContributors: AppBlock = {
  name: "Describe Alarm Contributors",
  description: `Returns the information of the current alarm contributors that are in ALARM state.`,
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
        AlarmName: {
          name: "Alarm Name",
          description:
            "The name of the alarm for which to retrieve contributor information.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token returned by a previous call to indicate that there is more data available.",
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

        const client = new CloudWatchClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAlarmContributorsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Alarm Contributors Result",
      description: "Result from DescribeAlarmContributors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AlarmContributors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ContributorId: {
                  type: "string",
                },
                ContributorAttributes: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                StateReason: {
                  type: "string",
                },
                StateTransitionedTimestamp: {
                  type: "string",
                },
              },
              required: [
                "ContributorId",
                "ContributorAttributes",
                "StateReason",
              ],
              additionalProperties: false,
            },
            description:
              "A list of alarm contributors that provide details about the individual time series contributing to the alarm's state.",
          },
          NextToken: {
            type: "string",
            description:
              "The token that marks the start of the next batch of returned results.",
          },
        },
        required: ["AlarmContributors"],
      },
    },
  },
};

export default describeAlarmContributors;
