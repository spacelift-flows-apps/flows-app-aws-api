import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutResourcePolicyCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putResourcePolicy: AppBlock = {
  name: "Put Resource Policy",
  description: `Creates or updates a resource policy allowing other Amazon Web Services services to put log events to this account, such as Amazon Route 53.`,
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
          description: "Name of the new policy.",
          type: "string",
          required: false,
        },
        policyDocument: {
          name: "policy Document",
          description:
            "Details of the new policy, including the identity of the principal that is enabled to put logs to this account.",
          type: "string",
          required: false,
        },
        resourceArn: {
          name: "resource Arn",
          description:
            "The ARN of the CloudWatch Logs resource to which the resource policy needs to be added or attached.",
          type: "string",
          required: false,
        },
        expectedRevisionId: {
          name: "expected Revision Id",
          description: "The expected revision ID of the resource policy.",
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

        const command = new PutResourcePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Resource Policy Result",
      description: "Result from PutResourcePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          resourcePolicy: {
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
            description: "The new policy.",
          },
          revisionId: {
            type: "string",
            description:
              "The revision ID of the created or updated resource policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putResourcePolicy;
