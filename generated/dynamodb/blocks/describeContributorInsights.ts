import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  DescribeContributorInsightsCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeContributorInsights: AppBlock = {
  name: "Describe Contributor Insights",
  description: `Returns information about contributor insights for a given table or global secondary index.`,
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
        TableName: {
          name: "Table Name",
          description: "The name of the table to describe.",
          type: "string",
          required: true,
        },
        IndexName: {
          name: "Index Name",
          description:
            "The name of the global secondary index to describe, if applicable.",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeContributorInsightsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Contributor Insights Result",
      description: "Result from DescribeContributorInsights operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableName: {
            type: "string",
            description: "The name of the table being described.",
          },
          IndexName: {
            type: "string",
            description:
              "The name of the global secondary index being described.",
          },
          ContributorInsightsRuleList: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of names of the associated contributor insights rules.",
          },
          ContributorInsightsStatus: {
            type: "string",
            description: "Current status of contributor insights.",
          },
          LastUpdateDateTime: {
            type: "string",
            description: "Timestamp of the last time the status was changed.",
          },
          FailureException: {
            type: "object",
            properties: {
              ExceptionName: {
                type: "string",
              },
              ExceptionDescription: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Returns information about the last failure that was encountered.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeContributorInsights;
