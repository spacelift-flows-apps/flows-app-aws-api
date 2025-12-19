import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeIntegrationsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeIntegrations: AppBlock = {
  name: "Describe Integrations",
  description: `Describe one or more zero-ETL integrations with Amazon Redshift.`,
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
          description: "The unique identifier of the integration.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more resources to return.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeIntegrations request.",
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

        const command = new DescribeIntegrationsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Integrations Result",
      description: "Result from DescribeIntegrations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "A pagination token that can be used in a later DescribeIntegrations request.",
          },
          Integrations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SourceArn: {
                  type: "string",
                },
                TargetArn: {
                  type: "string",
                },
                IntegrationName: {
                  type: "string",
                },
                IntegrationArn: {
                  type: "string",
                },
                KMSKeyId: {
                  type: "string",
                },
                AdditionalEncryptionContext: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
                Status: {
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
                    additionalProperties: false,
                  },
                },
                CreateTime: {
                  type: "string",
                },
                Errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ErrorCode: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ErrorMessage: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["ErrorCode"],
                    additionalProperties: false,
                  },
                },
                DataFilter: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of integrations.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeIntegrations;
