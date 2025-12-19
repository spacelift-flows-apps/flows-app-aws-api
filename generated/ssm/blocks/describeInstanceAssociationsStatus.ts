import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInstanceAssociationsStatusCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceAssociationsStatus: AppBlock = {
  name: "Describe Instance Associations Status",
  description: `The status of the associations for the managed nodes.`,
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
        InstanceId: {
          name: "Instance Id",
          description:
            "The managed node IDs for which you want association status information.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
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

        const command = new DescribeInstanceAssociationsStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Associations Status Result",
      description: "Result from DescribeInstanceAssociationsStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceAssociationStatusInfos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AssociationId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                DocumentVersion: {
                  type: "string",
                },
                AssociationVersion: {
                  type: "string",
                },
                InstanceId: {
                  type: "string",
                },
                ExecutionDate: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                DetailedStatus: {
                  type: "string",
                },
                ExecutionSummary: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                OutputUrl: {
                  type: "object",
                  properties: {
                    S3OutputUrl: {
                      type: "object",
                      properties: {
                        OutputUrl: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                AssociationName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Status information about the association.",
          },
          NextToken: {
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

export default describeInstanceAssociationsStatus;
