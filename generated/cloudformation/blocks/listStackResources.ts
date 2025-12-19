import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListStackResourcesCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStackResources: AppBlock = {
  name: "List Stack Resources",
  description: `Returns descriptions of all resources of the specified stack.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "The name or the unique stack ID that is associated with the stack, which aren't always interchangeable: Running stacks: You can specify either the stack's name or its unique stack ID.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string that identifies the next page of stack resources that you want to retrieve.",
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

        const command = new ListStackResourcesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Stack Resources Result",
      description: "Result from ListStackResources operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackResourceSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LogicalResourceId: {
                  type: "string",
                },
                PhysicalResourceId: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                LastUpdatedTimestamp: {
                  type: "string",
                },
                ResourceStatus: {
                  type: "string",
                },
                ResourceStatusReason: {
                  type: "string",
                },
                DriftInformation: {
                  type: "object",
                  properties: {
                    StackResourceDriftStatus: {
                      type: "string",
                    },
                    LastCheckTimestamp: {
                      type: "string",
                    },
                  },
                  required: ["StackResourceDriftStatus"],
                  additionalProperties: false,
                },
                ModuleInfo: {
                  type: "object",
                  properties: {
                    TypeHierarchy: {
                      type: "string",
                    },
                    LogicalIdHierarchy: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: [
                "LogicalResourceId",
                "ResourceType",
                "LastUpdatedTimestamp",
                "ResourceStatus",
              ],
              additionalProperties: false,
            },
            description: "A list of StackResourceSummary structures.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB, a string that identifies the next page of stack resources.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listStackResources;
