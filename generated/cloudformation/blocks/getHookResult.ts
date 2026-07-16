import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  GetHookResultCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getHookResult: AppBlock = {
  name: "Get Hook Result",
  description: `Retrieves detailed information and remediation guidance for a Hook invocation result.`,
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
        HookResultId: {
          name: "Hook Result Id",
          description:
            "The unique identifier (ID) of the Hook invocation result that you want details about.",
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

        const command = new GetHookResultCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Hook Result Result",
      description: "Result from GetHookResult operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HookResultId: {
            type: "string",
            description: "The unique identifier of the Hook result.",
          },
          InvocationPoint: {
            type: "string",
            description:
              "The specific point in the provisioning process where the Hook is invoked.",
          },
          FailureMode: {
            type: "string",
            description: "The failure mode of the invocation.",
          },
          TypeName: {
            type: "string",
            description: "The name of the Hook that was invoked.",
          },
          OriginalTypeName: {
            type: "string",
            description:
              "The original public type name of the Hook when an alias is used.",
          },
          TypeVersionId: {
            type: "string",
            description: "The version identifier of the Hook that was invoked.",
          },
          TypeConfigurationVersionId: {
            type: "string",
            description:
              "The version identifier of the Hook configuration data that was used during invocation.",
          },
          TypeArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the Hook.",
          },
          Status: {
            type: "string",
            description: "The status of the Hook invocation.",
          },
          HookStatusReason: {
            type: "string",
            description:
              "A message that provides additional details about the Hook invocation status.",
          },
          InvokedAt: {
            type: "string",
            description: "The timestamp when the Hook was invoked.",
          },
          Target: {
            type: "object",
            properties: {
              TargetType: {
                type: "string",
              },
              TargetTypeName: {
                type: "string",
              },
              TargetId: {
                type: "string",
              },
              Action: {
                type: "string",
              },
            },
            required: ["TargetType", "TargetTypeName", "TargetId", "Action"],
            additionalProperties: false,
            description: "Information about the target of the Hook invocation.",
          },
          Annotations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AnnotationName: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                RemediationMessage: {
                  type: "string",
                },
                RemediationLink: {
                  type: "string",
                },
                SeverityLevel: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of objects with additional information and guidance that can help you resolve a failed Hook invocation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getHookResult;
