import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeAccountPoliciesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAccountPolicies: AppBlock = {
  name: "Describe Account Policies",
  description: `Returns a list of all CloudWatch Logs account policies in the account.`,
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
        policyType: {
          name: "policy Type",
          description:
            "Use this parameter to limit the returned policies to only the policies that match the policy type that you specify.",
          type: "string",
          required: true,
        },
        policyName: {
          name: "policy Name",
          description:
            "Use this parameter to limit the returned policies to only the policy with the name that you specify.",
          type: "string",
          required: false,
        },
        accountIdentifiers: {
          name: "account Identifiers",
          description:
            "If you are using an account that is set up as a monitoring account for CloudWatch unified cross-account observability, you can use this to specify the account ID of a source account.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
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

        const command = new DescribeAccountPoliciesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Account Policies Result",
      description: "Result from DescribeAccountPolicies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          accountPolicies: {
            type: "array",
            items: {
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
            },
            description:
              "An array of structures that contain information about the CloudWatch Logs account policies that match the specified filters.",
          },
          nextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAccountPolicies;
