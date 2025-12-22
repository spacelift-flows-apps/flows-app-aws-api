import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ListDocumentsCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDocuments: AppBlock = {
  name: "List Documents",
  description: `Returns all Systems Manager (SSM) documents in the current Amazon Web Services account and Amazon Web Services Region.`,
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
        DocumentFilterList: {
          name: "Document Filter List",
          description: "This data type is deprecated.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                },
                value: {
                  type: "string",
                },
              },
              required: ["key", "value"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "One or more DocumentKeyValuesFilter objects.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListDocumentsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Documents Result",
      description: "Result from ListDocuments operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DocumentIdentifiers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                CreatedDate: {
                  type: "string",
                },
                DisplayName: {
                  type: "string",
                },
                Owner: {
                  type: "string",
                },
                VersionName: {
                  type: "string",
                },
                PlatformTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                DocumentVersion: {
                  type: "string",
                },
                DocumentType: {
                  type: "string",
                },
                SchemaVersion: {
                  type: "string",
                },
                DocumentFormat: {
                  type: "string",
                },
                TargetType: {
                  type: "string",
                },
                Tags: {
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
                Requires: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Version: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RequireType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      VersionName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Name"],
                    additionalProperties: false,
                  },
                },
                ReviewStatus: {
                  type: "string",
                },
                Author: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The names of the SSM documents.",
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

export default listDocuments;
