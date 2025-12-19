import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeAssociationExecutionTargetsCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAssociationExecutionTargets: AppBlock = {
  name: "Describe Association Execution Targets",
  description: `Views information about a specific execution of a specific association.`,
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
        AssociationId: {
          name: "Association Id",
          description:
            "The association ID that includes the execution for which you want to view details.",
          type: "string",
          required: true,
        },
        ExecutionId: {
          name: "Execution Id",
          description: "The execution ID for which you want to view details.",
          type: "string",
          required: true,
        },
        Filters: {
          name: "Filters",
          description: "Filters for the request.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAssociationExecutionTargetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Association Execution Targets Result",
      description: "Result from DescribeAssociationExecutionTargets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssociationExecutionTargets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AssociationId: {
                  type: "string",
                },
                AssociationVersion: {
                  type: "string",
                },
                ExecutionId: {
                  type: "string",
                },
                ResourceId: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                DetailedStatus: {
                  type: "string",
                },
                LastExecutionDate: {
                  type: "string",
                },
                OutputSource: {
                  type: "object",
                  properties: {
                    OutputSourceId: {
                      type: "string",
                    },
                    OutputSourceType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the execution.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAssociationExecutionTargets;
