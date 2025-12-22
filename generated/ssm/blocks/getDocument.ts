import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetDocumentCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDocument: AppBlock = {
  name: "Get Document",
  description: `Gets the contents of the specified Amazon Web Services Systems Manager document (SSM document).`,
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
        Name: {
          name: "Name",
          description: "The name of the SSM document.",
          type: "string",
          required: true,
        },
        VersionName: {
          name: "Version Name",
          description:
            "An optional field specifying the version of the artifact associated with the document.",
          type: "string",
          required: false,
        },
        DocumentVersion: {
          name: "Document Version",
          description: "The document version for which you want information.",
          type: "string",
          required: false,
        },
        DocumentFormat: {
          name: "Document Format",
          description: "Returns the document in the specified format.",
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

        const command = new GetDocumentCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Document Result",
      description: "Result from GetDocument operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description: "The name of the SSM document.",
          },
          CreatedDate: {
            type: "string",
            description: "The date the SSM document was created.",
          },
          DisplayName: {
            type: "string",
            description: "The friendly name of the SSM document.",
          },
          VersionName: {
            type: "string",
            description:
              "The version of the artifact associated with the document.",
          },
          DocumentVersion: {
            type: "string",
            description: "The document version.",
          },
          Status: {
            type: "string",
            description:
              "The status of the SSM document, such as Creating, Active, Updating, Failed, and Deleting.",
          },
          StatusInformation: {
            type: "string",
            description:
              "A message returned by Amazon Web Services Systems Manager that explains the Status value.",
          },
          Content: {
            type: "string",
            description: "The contents of the SSM document.",
          },
          DocumentType: {
            type: "string",
            description: "The document type.",
          },
          DocumentFormat: {
            type: "string",
            description: "The document format, either JSON or YAML.",
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
            description: "A list of SSM documents required by a document.",
          },
          AttachmentsContent: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Size: {
                  type: "number",
                },
                Hash: {
                  type: "string",
                },
                HashType: {
                  type: "string",
                },
                Url: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A description of the document attachments, including names, locations, sizes, and so on.",
          },
          ReviewStatus: {
            type: "string",
            description:
              "The current review status of a new custom Systems Manager document (SSM document) created by a member of your organization, or of the latest version of an existing SSM document.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDocument;
