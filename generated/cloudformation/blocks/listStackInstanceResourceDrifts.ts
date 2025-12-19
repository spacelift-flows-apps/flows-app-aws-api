import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListStackInstanceResourceDriftsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStackInstanceResourceDrifts: AppBlock = {
  name: "List Stack Instance Resource Drifts",
  description: `Returns drift information for resources in a stack instance.`,
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
        StackSetName: {
          name: "Stack Set Name",
          description:
            "The name or unique ID of the stack set that you want to list drifted resources for.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "If the previous paginated request didn't return all of the remaining results, the response object's NextToken parameter value is set to a token.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to be returned with a single call.",
          type: "number",
          required: false,
        },
        StackInstanceResourceDriftStatuses: {
          name: "Stack Instance Resource Drift Statuses",
          description: "The resource drift status of the stack instance.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        StackInstanceAccount: {
          name: "Stack Instance Account",
          description:
            "The name of the Amazon Web Services account that you want to list resource drifts for.",
          type: "string",
          required: true,
        },
        StackInstanceRegion: {
          name: "Stack Instance Region",
          description:
            "The name of the Region where you want to list resource drifts.",
          type: "string",
          required: true,
        },
        OperationId: {
          name: "Operation Id",
          description: "The unique ID of the drift operation.",
          type: "string",
          required: true,
        },
        CallAs: {
          name: "Call As",
          description:
            "[Service-managed permissions] Specifies whether you are acting as an account administrator in the organization's management account or as a delegated administrator in a member account.",
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

        const command = new ListStackInstanceResourceDriftsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Stack Instance Resource Drifts Result",
      description: "Result from ListStackInstanceResourceDrifts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Summaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackId: {
                  type: "string",
                },
                LogicalResourceId: {
                  type: "string",
                },
                PhysicalResourceId: {
                  type: "string",
                },
                PhysicalResourceIdContext: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                },
                ResourceType: {
                  type: "string",
                },
                PropertyDifferences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PropertyPath: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ExpectedValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ActualValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DifferenceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: [
                      "PropertyPath",
                      "ExpectedValue",
                      "ActualValue",
                      "DifferenceType",
                    ],
                    additionalProperties: false,
                  },
                },
                StackResourceDriftStatus: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
              },
              required: [
                "StackId",
                "LogicalResourceId",
                "ResourceType",
                "StackResourceDriftStatus",
                "Timestamp",
              ],
              additionalProperties: false,
            },
            description:
              "A list of StackInstanceResourceDriftsSummary structures that contain information about the specified stack instances.",
          },
          NextToken: {
            type: "string",
            description:
              "If the previous paginated request didn't return all of the remaining results, the response object's NextToken parameter value is set to a token.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listStackInstanceResourceDrifts;
