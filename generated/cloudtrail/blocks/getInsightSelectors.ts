import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  GetInsightSelectorsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInsightSelectors: AppBlock = {
  name: "Get Insight Selectors",
  description: `Describes the settings for the Insights event selectors that you configured for your trail or event data store.`,
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
          description: "Specifies the name of the trail or trail ARN.",
          type: "string",
          required: false,
        },
        EventDataStore: {
          name: "Event Data Store",
          description:
            "Specifies the ARN (or ID suffix of the ARN) of the event data store for which you want to get Insights selectors.",
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

        const command = new GetInsightSelectorsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Insight Selectors Result",
      description: "Result from GetInsightSelectors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrailARN: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of a trail for which you want to get Insights selectors.",
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
              "A JSON string that contains the Insight types you want to log on a trail or event data store.",
          },
          EventDataStoreArn: {
            type: "string",
            description:
              "The ARN of the source event data store that enabled Insights events.",
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

export default getInsightSelectors;
