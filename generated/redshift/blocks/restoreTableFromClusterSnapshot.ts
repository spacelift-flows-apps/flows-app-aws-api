import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  RestoreTableFromClusterSnapshotCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const restoreTableFromClusterSnapshot: AppBlock = {
  name: "Restore Table From Cluster Snapshot",
  description: `Creates a new table from a table in an Amazon Redshift cluster snapshot.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the Amazon Redshift cluster to restore the table to.",
          type: "string",
          required: true,
        },
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "The identifier of the snapshot to restore the table from.",
          type: "string",
          required: true,
        },
        SourceDatabaseName: {
          name: "Source Database Name",
          description:
            "The name of the source database that contains the table to restore from.",
          type: "string",
          required: true,
        },
        SourceSchemaName: {
          name: "Source Schema Name",
          description:
            "The name of the source schema that contains the table to restore from.",
          type: "string",
          required: false,
        },
        SourceTableName: {
          name: "Source Table Name",
          description: "The name of the source table to restore from.",
          type: "string",
          required: true,
        },
        TargetDatabaseName: {
          name: "Target Database Name",
          description: "The name of the database to restore the table to.",
          type: "string",
          required: false,
        },
        TargetSchemaName: {
          name: "Target Schema Name",
          description: "The name of the schema to restore the table to.",
          type: "string",
          required: false,
        },
        NewTableName: {
          name: "New Table Name",
          description:
            "The name of the table to create as a result of the current request.",
          type: "string",
          required: true,
        },
        EnableCaseSensitiveIdentifier: {
          name: "Enable Case Sensitive Identifier",
          description:
            "Indicates whether name identifiers for database, schema, and table are case sensitive.",
          type: "boolean",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new RestoreTableFromClusterSnapshotCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Restore Table From Cluster Snapshot Result",
      description: "Result from RestoreTableFromClusterSnapshot operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableRestoreStatus: {
            type: "object",
            properties: {
              TableRestoreRequestId: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              Message: {
                type: "string",
              },
              RequestTime: {
                type: "string",
              },
              ProgressInMegaBytes: {
                type: "number",
              },
              TotalDataInMegaBytes: {
                type: "number",
              },
              ClusterIdentifier: {
                type: "string",
              },
              SnapshotIdentifier: {
                type: "string",
              },
              SourceDatabaseName: {
                type: "string",
              },
              SourceSchemaName: {
                type: "string",
              },
              SourceTableName: {
                type: "string",
              },
              TargetDatabaseName: {
                type: "string",
              },
              TargetSchemaName: {
                type: "string",
              },
              NewTableName: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Describes the status of a RestoreTableFromClusterSnapshot operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default restoreTableFromClusterSnapshot;
