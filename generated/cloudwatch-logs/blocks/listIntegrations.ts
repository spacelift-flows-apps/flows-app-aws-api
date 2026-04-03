import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  ListIntegrationsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listIntegrations: AppBlock = {
  name: "List Integrations",
  description: `Returns a list of integrations between CloudWatch Logs and other services in this account.`,
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
        integrationNamePrefix: {
          name: "integration Name Prefix",
          description:
            "To limit the results to integrations that start with a certain name prefix, specify that name prefix here.",
          type: "string",
          required: false,
        },
        integrationType: {
          name: "integration Type",
          description:
            "To limit the results to integrations of a certain type, specify that type here.",
          type: "string",
          required: false,
        },
        integrationStatus: {
          name: "integration Status",
          description:
            "To limit the results to integrations with a certain status, specify that status here.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListIntegrationsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Integrations Result",
      description: "Result from ListIntegrations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          integrationSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                integrationName: {
                  type: "string",
                },
                integrationType: {
                  type: "string",
                },
                integrationStatus: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "An array, where each object in the array contains information about one CloudWatch Logs integration in this account.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listIntegrations;
