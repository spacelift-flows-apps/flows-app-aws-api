import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyIntegrationCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyIntegration: AppBlock = {
  name: "Modify Integration",
  description: `Modifies a zero-ETL integration with Amazon Redshift.`,
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
        IntegrationIdentifier: {
          name: "Integration Identifier",
          description: "The unique identifier of the integration to modify.",
          type: "string",
          required: true,
        },
        IntegrationName: {
          name: "Integration Name",
          description: "A new name for the integration.",
          type: "string",
          required: false,
        },
        DataFilter: {
          name: "Data Filter",
          description: "A new data filter for the integration.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A new description for the integration.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyIntegrationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Integration Result",
      description: "Result from ModifyIntegration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SourceArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the database used as the source for replication.",
          },
          TargetArn: {
            type: "string",
            description:
              "The ARN of the Redshift data warehouse used as the target for replication.",
          },
          IntegrationName: {
            type: "string",
            description: "The name of the integration.",
          },
          IntegrationArn: {
            type: "string",
            description: "The ARN of the integration.",
          },
          KMSKeyId: {
            type: "string",
            description:
              "The Amazon Web Services Key Management System (Amazon Web Services KMS) key identifier for the key used to to encrypt the integration.",
          },
          AdditionalEncryptionContext: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description: "The encryption context for the integration.",
          },
          Status: {
            type: "string",
            description: "The current status of the integration.",
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
              additionalProperties: false,
            },
            description: "A list of tags.",
          },
          CreateTime: {
            type: "string",
            description:
              "The time when the integration was created, in Universal Coordinated Time (UTC).",
          },
          Errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              required: ["ErrorCode"],
              additionalProperties: false,
            },
            description: "Any errors associated with the integration.",
          },
          DataFilter: {
            type: "string",
            description: "Data filters for the integration.",
          },
          Description: {
            type: "string",
            description: "A description of the integration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyIntegration;
