import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const simulatePrincipalPolicy: AppBlock = {
  name: "Simulate Principal Policy",
  description: `Simulate how a set of IAM policies attached to an IAM entity works with a list of API operations and Amazon Web Services resources to determine the policies' effective permissions.`,
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
        PolicySourceArn: {
          name: "Policy Source Arn",
          description:
            "The Amazon Resource Name (ARN) of a user, group, or role whose policies you want to include in the simulation.",
          type: "string",
          required: true,
        },
        PolicyInputList: {
          name: "Policy Input List",
          description:
            "An optional list of additional policy documents to include in the simulation.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        PermissionsBoundaryPolicyInputList: {
          name: "Permissions Boundary Policy Input List",
          description: "The IAM permissions boundary policy to simulate.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ActionNames: {
          name: "Action Names",
          description:
            "A list of names of API operations to evaluate in the simulation.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        ResourceArns: {
          name: "Resource Arns",
          description:
            "A list of ARNs of Amazon Web Services resources to include in the simulation.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ResourcePolicy: {
          name: "Resource Policy",
          description:
            "A resource-based policy to include in the simulation provided as a string.",
          type: "string",
          required: false,
        },
        ResourceOwner: {
          name: "Resource Owner",
          description:
            "An Amazon Web Services account ID that specifies the owner of any simulated resource that does not identify its owner in the resource ARN.",
          type: "string",
          required: false,
        },
        CallerArn: {
          name: "Caller Arn",
          description:
            "The ARN of the IAM user that you want to specify as the simulated caller of the API operations.",
          type: "string",
          required: false,
        },
        ContextEntries: {
          name: "Context Entries",
          description:
            "A list of context keys and corresponding values for the simulation to use.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ContextKeyName: {
                  type: "string",
                },
                ContextKeyValues: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ContextKeyType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        ResourceHandlingOption: {
          name: "Resource Handling Option",
          description: "Specifies the type of simulation to run.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "Use this only when paginating results to indicate the maximum number of items you want in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this parameter only when paginating results and only after you receive a response indicating that the results are truncated.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SimulatePrincipalPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Simulate Principal Policy Result",
      description: "Result from SimulatePrincipalPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EvaluationResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EvalActionName: {
                  type: "string",
                },
                EvalResourceName: {
                  type: "string",
                },
                EvalDecision: {
                  type: "string",
                },
                MatchedStatements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      SourcePolicyId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SourcePolicyType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StartPosition: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EndPosition: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                MissingContextValues: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                OrganizationsDecisionDetail: {
                  type: "object",
                  properties: {
                    AllowedByOrganizations: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                PermissionsBoundaryDecisionDetail: {
                  type: "object",
                  properties: {
                    AllowedByPermissionsBoundary: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                EvalDecisionDetails: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                ResourceSpecificResults: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      EvalResourceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EvalResourceDecision: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MatchedStatements: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MissingContextValues: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EvalDecisionDetails: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PermissionsBoundaryDecisionDetail: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["EvalResourceName", "EvalResourceDecision"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["EvalActionName", "EvalDecision"],
              additionalProperties: false,
            },
            description: "The results of the simulation.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more items to return.",
          },
          Marker: {
            type: "string",
            description:
              "When IsTruncated is true, this element is present and contains the value to use for the Marker parameter in a subsequent pagination request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default simulatePrincipalPolicy;
