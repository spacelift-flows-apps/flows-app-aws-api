import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  DescribeEffectivePolicyCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEffectivePolicy: AppBlock = {
  name: "Describe Effective Policy",
  description: `Returns the contents of the effective policy for specified policy type and account.`,
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
        PolicyType: {
          name: "Policy Type",
          description: "The type of policy that you want information about.",
          type: "string",
          required: true,
        },
        TargetId: {
          name: "Target Id",
          description:
            "When you're signed in as the management account, specify the ID of the account that you want details about.",
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEffectivePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Effective Policy Result",
      description: "Result from DescribeEffectivePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EffectivePolicy: {
            type: "object",
            properties: {
              PolicyContent: {
                type: "string",
              },
              LastUpdatedTimestamp: {
                type: "string",
              },
              TargetId: {
                type: "string",
              },
              PolicyType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The contents of the effective policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEffectivePolicy;
