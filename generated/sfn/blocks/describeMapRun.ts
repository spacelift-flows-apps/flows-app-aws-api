import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, DescribeMapRunCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeMapRun: AppBlock = {
  name: "Describe Map Run",
  description: `Provides information about a Map Run's configuration, progress, and results.`,
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
        mapRunArn: {
          name: "map Run Arn",
          description:
            "The Amazon Resource Name (ARN) that identifies a Map Run.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeMapRunCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Map Run Result",
      description: "Result from DescribeMapRun operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          mapRunArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies a Map Run.",
          },
          executionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the execution in which the Map Run was started.",
          },
          status: {
            type: "string",
            description: "The current status of the Map Run.",
          },
          startDate: {
            type: "string",
            description: "The date when the Map Run was started.",
          },
          stopDate: {
            type: "string",
            description: "The date when the Map Run was stopped.",
          },
          maxConcurrency: {
            type: "number",
            description:
              "The maximum number of child workflow executions configured to run in parallel for the Map Run at the same time.",
          },
          toleratedFailurePercentage: {
            type: "number",
            description:
              "The maximum percentage of failed child workflow executions before the Map Run fails.",
          },
          toleratedFailureCount: {
            type: "number",
            description:
              "The maximum number of failed child workflow executions before the Map Run fails.",
          },
          itemCounts: {
            type: "object",
            properties: {
              pending: {
                type: "number",
              },
              running: {
                type: "number",
              },
              succeeded: {
                type: "number",
              },
              failed: {
                type: "number",
              },
              timedOut: {
                type: "number",
              },
              aborted: {
                type: "number",
              },
              total: {
                type: "number",
              },
              resultsWritten: {
                type: "number",
              },
              failuresNotRedrivable: {
                type: "number",
              },
              pendingRedrive: {
                type: "number",
              },
            },
            required: [
              "pending",
              "running",
              "succeeded",
              "failed",
              "timedOut",
              "aborted",
              "total",
              "resultsWritten",
            ],
            additionalProperties: false,
            description:
              "A JSON object that contains information about the total number of items, and the item count for each processing status, such as pending and failed.",
          },
          executionCounts: {
            type: "object",
            properties: {
              pending: {
                type: "number",
              },
              running: {
                type: "number",
              },
              succeeded: {
                type: "number",
              },
              failed: {
                type: "number",
              },
              timedOut: {
                type: "number",
              },
              aborted: {
                type: "number",
              },
              total: {
                type: "number",
              },
              resultsWritten: {
                type: "number",
              },
              failuresNotRedrivable: {
                type: "number",
              },
              pendingRedrive: {
                type: "number",
              },
            },
            required: [
              "pending",
              "running",
              "succeeded",
              "failed",
              "timedOut",
              "aborted",
              "total",
              "resultsWritten",
            ],
            additionalProperties: false,
            description:
              "A JSON object that contains information about the total number of child workflow executions for the Map Run, and the count of child workflow executions for each status, such as failed and succeeded.",
          },
          redriveCount: {
            type: "number",
            description: "The number of times you've redriven a Map Run.",
          },
          redriveDate: {
            type: "string",
            description: "The date a Map Run was last redriven.",
          },
        },
        required: [
          "mapRunArn",
          "executionArn",
          "status",
          "startDate",
          "maxConcurrency",
          "toleratedFailurePercentage",
          "toleratedFailureCount",
          "itemCounts",
          "executionCounts",
        ],
      },
    },
  },
};

export default describeMapRun;
