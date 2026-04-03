import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutIndexPolicyCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putIndexPolicy: AppBlock = {
  name: "Put Index Policy",
  description: `Creates or updates a field index policy for the specified log group.`,
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
        logGroupIdentifier: {
          name: "log Group Identifier",
          description:
            "Specify either the log group name or log group ARN to apply this field index policy to.",
          type: "string",
          required: true,
        },
        policyDocument: {
          name: "policy Document",
          description: "The index policy document, in JSON format.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutIndexPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Index Policy Result",
      description: "Result from PutIndexPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          indexPolicy: {
            type: "object",
            properties: {
              logGroupIdentifier: {
                type: "string",
              },
              lastUpdateTime: {
                type: "number",
              },
              policyDocument: {
                type: "string",
              },
              policyName: {
                type: "string",
              },
              source: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The index policy that you just created or updated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putIndexPolicy;
