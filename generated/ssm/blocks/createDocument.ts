import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateDocumentCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDocument: AppBlock = {
  name: "Create Document",
  description: `Creates a Amazon Web Services Systems Manager (SSM document).`,
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
        Content: {
          name: "Content",
          description:
            "The content for the new SSM document in JSON or YAML format.",
          type: "string",
          required: true,
        },
        Requires: {
          name: "Requires",
          description: "A list of SSM documents required by a document.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Version: {
                  type: "string",
                },
                RequireType: {
                  type: "string",
                },
                VersionName: {
                  type: "string",
                },
              },
              required: ["Name"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Attachments: {
          name: "Attachments",
          description:
            "A list of key-value pairs that describe attachments to a version of a document.",
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
                Name: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        Name: {
          name: "Name",
          description: "A name for the SSM document.",
          type: "string",
          required: true,
        },
        DisplayName: {
          name: "Display Name",
          description:
            "An optional field where you can specify a friendly name for the SSM document.",
          type: "string",
          required: false,
        },
        VersionName: {
          name: "Version Name",
          description:
            "An optional field specifying the version of the artifact you are creating with the document.",
          type: "string",
          required: false,
        },
        DocumentType: {
          name: "Document Type",
          description: "The type of document to create.",
          type: "string",
          required: false,
        },
        DocumentFormat: {
          name: "Document Format",
          description: "Specify the document format for the request.",
          type: "string",
          required: false,
        },
        TargetType: {
          name: "Target Type",
          description:
            "Specify a target type to define the kinds of resources the document can run on.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Optional metadata that you assign to a resource.",
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
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateDocumentCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Document Result",
      description: "Result from CreateDocument operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DocumentDescription: {
            type: "object",
            properties: {
              Sha1: {
                type: "string",
              },
              Hash: {
                type: "string",
              },
              HashType: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              DisplayName: {
                type: "string",
              },
              VersionName: {
                type: "string",
              },
              Owner: {
                type: "string",
              },
              CreatedDate: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              StatusInformation: {
                type: "string",
              },
              DocumentVersion: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              Parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                    DefaultValue: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              PlatformTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              DocumentType: {
                type: "string",
              },
              SchemaVersion: {
                type: "string",
              },
              LatestVersion: {
                type: "string",
              },
              DefaultVersion: {
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
              AttachmentsInformation: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Requires: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Version: {
                      type: "string",
                    },
                    RequireType: {
                      type: "string",
                    },
                    VersionName: {
                      type: "string",
                    },
                  },
                  required: ["Name"],
                  additionalProperties: false,
                },
              },
              Author: {
                type: "string",
              },
              ReviewInformation: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ReviewedTime: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    Reviewer: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ApprovedVersion: {
                type: "string",
              },
              PendingReviewVersion: {
                type: "string",
              },
              ReviewStatus: {
                type: "string",
              },
              Category: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              CategoryEnum: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "Information about the SSM document.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDocument;
