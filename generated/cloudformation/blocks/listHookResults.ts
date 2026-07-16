import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListHookResultsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHookResults: AppBlock = {
  name: "List Hook Results",
  description: `Returns summaries of invoked Hooks.`,
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
          description: "Filters results by target type.",
          type: "string",
          required: false,
        },
        TargetId: {
          name: "Target Id",
          description:
            "Filters results by the unique identifier of the target the Hook was invoked against.",
          type: "string",
          required: false,
        },
        TypeArn: {
          name: "Type Arn",
          description: "Filters results by the ARN of the Hook.",
          type: "string",
          required: false,
        },
        Status: {
          name: "Status",
          description: "Filters results by the status of Hook invocations.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
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
            description: "The target type.",
          },
          TargetId: {
            type: "string",
            description: "The unique identifier of the Hook invocation target.",
          },
          HookResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                HookResultId: {
                  type: "string",
                },
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
                InvokedAt: {
                  type: "string",
                },
                TargetType: {
                  type: "string",
                },
                TargetId: {
                  type: "string",
                },
                TypeArn: {
                  type: "string",
                },
                HookExecutionTarget: {
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
