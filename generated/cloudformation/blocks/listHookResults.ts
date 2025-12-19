import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListHookResultsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHookResults: AppBlock = {
  name: "List Hook Results",
  description: `Returns summaries of invoked Hooks when a change set or Cloud Control API operation target is provided.`,
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
        TargetType: {
          name: "Target Type",
          description: "The type of operation being targeted by the Hook.",
          type: "string",
          required: true,
        },
        TargetId: {
          name: "Target Id",
          description:
            "The logical ID of the target the operation is acting on by the Hook.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string that identifies the next page of events that you want to retrieve.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListHookResultsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Hook Results Result",
      description: "Result from ListHookResults operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TargetType: {
            type: "string",
            description: "The type of operation being targeted by the Hook.",
          },
          TargetId: {
            type: "string",
            description:
              "The logical ID of the target the operation is acting on by the Hook.",
          },
          HookResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InvocationPoint: {
                  type: "string",
                },
                FailureMode: {
                  type: "string",
                },
                TypeName: {
                  type: "string",
                },
                TypeVersionId: {
                  type: "string",
                },
                TypeConfigurationVersionId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                HookStatusReason: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of HookResultSummary structures that provides the status and Hook status reason for each Hook invocation for the specified target.",
          },
          NextToken: {
            type: "string",
            description: "Pagination token, null or empty if no more results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listHookResults;
