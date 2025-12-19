import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  ListDocumentMetadataHistoryCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDocumentMetadataHistory: AppBlock = {
  name: "List Document Metadata History",
  description: `Information about approval reviews for a version of a change template in Change Manager.`,
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
          description: "The name of the change template.",
          type: "string",
          required: true,
        },
        DocumentVersion: {
          name: "Document Version",
          description: "The version of the change template.",
          type: "string",
          required: false,
        },
        Metadata: {
          name: "Metadata",
          description:
            "The type of data for which details are being requested.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
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

        const command = new ListDocumentMetadataHistoryCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Document Metadata History Result",
      description: "Result from ListDocumentMetadataHistory operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description: "The name of the change template.",
          },
          DocumentVersion: {
            type: "string",
            description: "The version of the change template.",
          },
          Author: {
            type: "string",
            description:
              "The user ID of the person in the organization who requested the review of the change template.",
          },
          Metadata: {
            type: "object",
            properties: {
              ReviewerResponse: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    CreateTime: {
                      type: "string",
                    },
                    UpdatedTime: {
                      type: "string",
                    },
                    ReviewStatus: {
                      type: "string",
                    },
                    Comment: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Reviewer: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Information about the response to the change template approval request.",
          },
          NextToken: {
            type: "string",
            description: "The maximum number of items to return for this call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDocumentMetadataHistory;
