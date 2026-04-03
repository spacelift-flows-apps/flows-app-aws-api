import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeResourcePoliciesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeResourcePolicies: AppBlock = {
  name: "Describe Resource Policies",
  description: `Lists the resource policies in this account.`,
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
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description:
            "The maximum number of resource policies to be displayed with one call of this API.",
          type: "number",
          required: false,
        },
        resourceArn: {
          name: "resource Arn",
          description:
            "The ARN of the CloudWatch Logs resource for which to query the resource policy.",
          type: "string",
          required: false,
        },
        policyScope: {
          name: "policy Scope",
          description: "Specifies the scope of the resource policy.",
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

        const command = new DescribeResourcePoliciesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Resource Policies Result",
      description: "Result from DescribeResourcePolicies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          resourcePolicies: {
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
                policyScope: {
                  type: "string",
                },
                resourceArn: {
                  type: "string",
                },
                revisionId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The resource policies that exist in this account.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeResourcePolicies;
