import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  PutInsightSelectorsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putInsightSelectors: AppBlock = {
  name: "Put Insight Selectors",
  description: `Lets you enable Insights event logging by specifying the Insights selectors that you want to enable on an existing trail or event data store.`,
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
        TrailName: {
          name: "Trail Name",
          description:
            "The name of the CloudTrail trail for which you want to change or add Insights selectors.",
          type: "string",
          required: false,
        },
        InsightSelectors: {
          name: "Insight Selectors",
          description:
            "A JSON string that contains the Insights types you want to log on a trail or event data store.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InsightType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        EventDataStore: {
          name: "Event Data Store",
          description:
            "The ARN (or ID suffix of the ARN) of the source event data store for which you want to change or add Insights selectors.",
          type: "string",
          required: false,
        },
        InsightsDestination: {
          name: "Insights Destination",
          description:
            "The ARN (or ID suffix of the ARN) of the destination event data store that logs Insights events.",
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

        const command = new PutInsightSelectorsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Insight Selectors Result",
      description: "Result from PutInsightSelectors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrailARN: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of a trail for which you want to change or add Insights selectors.",
          },
          InsightSelectors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InsightType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A JSON string that contains the Insights event types that you want to log on a trail or event data store.",
          },
          EventDataStoreArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the source event data store for which you want to change or add Insights selectors.",
          },
          InsightsDestination: {
            type: "string",
            description:
              "The ARN of the destination event data store that logs Insights events.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putInsightSelectors;
