import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyTenantDatabaseCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyTenantDatabase: AppBlock = {
  name: "Modify Tenant Database",
  description: `Modifies an existing tenant database in a DB instance.`,
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
          description:
            "The identifier of the DB instance that contains the tenant database that you are modifying.",
          type: "string",
          required: true,
        },
        TenantDBName: {
          name: "Tenant DB Name",
          description:
            "The user-supplied name of the tenant database that you want to modify.",
          type: "string",
          required: true,
        },
        MasterUserPassword: {
          name: "Master User Password",
          description:
            "The new password for the master user of the specified tenant database in your DB instance.",
          type: "string",
          required: false,
        },
        NewTenantDBName: {
          name: "New Tenant DB Name",
          description:
            "The new name of the tenant database when renaming a tenant database.",
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
        RotateMasterUserPassword: {
          name: "Rotate Master User Password",
          description:
            "Specifies whether to rotate the secret managed by Amazon Web Services Secrets Manager for the master user password.",
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

        const command = new ModifyTenantDatabaseCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Tenant Database Result",
      description: "Result from ModifyTenantDatabase operation",
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

export default modifyTenantDatabase;
