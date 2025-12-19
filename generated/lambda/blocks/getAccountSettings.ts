import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetAccountSettingsCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAccountSettings: AppBlock = {
  name: "Get Account Settings",
  description: `Retrieves details about your account's limits and usage in an Amazon Web Services Region.`,
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAccountSettingsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Account Settings Result",
      description: "Result from GetAccountSettings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountLimit: {
            type: "object",
            properties: {
              TotalCodeSize: {
                type: "number",
              },
              CodeSizeUnzipped: {
                type: "number",
              },
              CodeSizeZipped: {
                type: "number",
              },
              ConcurrentExecutions: {
                type: "number",
              },
              UnreservedConcurrentExecutions: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "Limits that are related to concurrency and code storage.",
          },
          AccountUsage: {
            type: "object",
            properties: {
              TotalCodeSize: {
                type: "number",
              },
              FunctionCount: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "The number of functions and amount of storage in use.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getAccountSettings;
