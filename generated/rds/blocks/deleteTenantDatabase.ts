import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DeleteTenantDatabaseCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteTenantDatabase: AppBlock = {
  name: "Delete Tenant Database",
  description: `Deletes a tenant database from your DB instance.`,
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
            "The user-supplied identifier for the DB instance that contains the tenant database that you want to delete.",
          type: "string",
          required: true,
        },
        TenantDBName: {
          name: "Tenant DB Name",
          description:
            "The user-supplied name of the tenant database that you want to remove from your DB instance.",
          type: "string",
          required: true,
        },
        SkipFinalSnapshot: {
          name: "Skip Final Snapshot",
          description:
            "Specifies whether to skip the creation of a final DB snapshot before removing the tenant database from your DB instance.",
          type: "boolean",
          required: false,
        },
        FinalDBSnapshotIdentifier: {
          name: "Final DB Snapshot Identifier",
          description:
            "The DBSnapshotIdentifier of the new DBSnapshot created when the SkipFinalSnapshot parameter is disabled.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteTenantDatabaseCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Tenant Database Result",
      description: "Result from DeleteTenantDatabase operation",
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

export default deleteTenantDatabase;
