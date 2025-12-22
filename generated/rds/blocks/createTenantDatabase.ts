import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateTenantDatabaseCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTenantDatabase: AppBlock = {
  name: "Create Tenant Database",
  description: `Creates a tenant database in a DB instance that uses the multi-tenant configuration.`,
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
        DBInstanceIdentifier: {
          name: "DB Instance Identifier",
          description: "The user-supplied DB instance identifier.",
          type: "string",
          required: true,
        },
        TenantDBName: {
          name: "Tenant DB Name",
          description:
            "The user-supplied name of the tenant database that you want to create in your DB instance.",
          type: "string",
          required: true,
        },
        MasterUsername: {
          name: "Master Username",
          description:
            "The name for the master user account in your tenant database.",
          type: "string",
          required: true,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description:
            "The password for the master user in your tenant database.",
          type: "string",
          required: false,
        },
        CharacterSetName: {
          name: "Character Set Name",
          description: "The character set for your tenant database.",
          type: "string",
          required: false,
        },
        NcharCharacterSetName: {
          name: "Nchar Character Set Name",
          description: "The NCHAR value for the tenant database.",
          type: "string",
          required: false,
        },
        ManageMasterUserPassword: {
          name: "Manage Master User Password",
          description:
            "Specifies whether to manage the master user password with Amazon Web Services Secrets Manager.",
          type: "boolean",
          required: false,
        },
        MasterUserSecretKmsKeyId: {
          name: "Master User Secret Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier to encrypt a secret that is automatically generated and managed in Amazon Web Services Secrets Manager.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateTenantDatabaseCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Tenant Database Result",
      description: "Result from CreateTenantDatabase operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TenantDatabase: {
            type: "object",
            properties: {
              TenantDatabaseCreateTime: {
                type: "string",
              },
              DBInstanceIdentifier: {
                type: "string",
              },
              TenantDBName: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              MasterUsername: {
                type: "string",
              },
              DbiResourceId: {
                type: "string",
              },
              TenantDatabaseResourceId: {
                type: "string",
              },
              TenantDatabaseARN: {
                type: "string",
              },
              CharacterSetName: {
                type: "string",
              },
              NcharCharacterSetName: {
                type: "string",
              },
              DeletionProtection: {
                type: "boolean",
              },
              PendingModifiedValues: {
                type: "object",
                properties: {
                  MasterUserPassword: {
                    type: "string",
                  },
                  TenantDBName: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              MasterUserSecret: {
                type: "object",
                properties: {
                  SecretArn: {
                    type: "string",
                  },
                  SecretStatus: {
                    type: "string",
                  },
                  KmsKeyId: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              TagList: {
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
              },
            },
            additionalProperties: false,
            description: "A tenant database in the DB instance.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTenantDatabase;
