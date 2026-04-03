import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutAccountPolicyCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putAccountPolicy: AppBlock = {
  name: "Put Account Policy",
  description: `Creates an account-level data protection policy, subscription filter policy, field index policy, transformer policy, or metric extraction policy that applies to all log groups, a subset of log groups, or a data source name and type combination in the account.`,
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
        policyName: {
          name: "policy Name",
          description: "A name for the policy.",
          type: "string",
          required: true,
        },
        policyDocument: {
          name: "policy Document",
          description: "Specify the policy, in JSON.",
          type: "string",
          required: true,
        },
        policyType: {
          name: "policy Type",
          description: "The type of policy that you're creating or updating.",
          type: "string",
          required: true,
        },
        scope: {
          name: "scope",
          description:
            "Currently the only valid value for this parameter is ALL, which specifies that the data protection policy applies to all log groups in the account.",
          type: "string",
          required: false,
        },
        selectionCriteria: {
          name: "selection Criteria",
          description:
            "Use this parameter to apply the new policy to a subset of log groups in the account or a data source name and type combination.",
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

        const command = new PutAccountPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Account Policy Result",
      description: "Result from PutAccountPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          accountPolicy: {
            type: "object",
            properties: {
              policyName: {
                type: "string",
              },
              policyDocument: {
                type: "string",
              },
              lastUpdatedTime: {
                type: "number",
              },
              policyType: {
                type: "string",
              },
              scope: {
                type: "string",
              },
              selectionCriteria: {
                type: "string",
              },
              accountId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The account policy that you created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putAccountPolicy;
