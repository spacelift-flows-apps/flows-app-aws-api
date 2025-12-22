import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBShardGroupCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBShardGroup: AppBlock = {
  name: "Create DB Shard Group",
  description: `Creates a new DB shard group for Aurora Limitless Database.`,
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
        DBShardGroupIdentifier: {
          name: "DB Shard Group Identifier",
          description: "The name of the DB shard group.",
          type: "string",
          required: true,
        },
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The name of the primary DB cluster for the DB shard group.",
          type: "string",
          required: true,
        },
        ComputeRedundancy: {
          name: "Compute Redundancy",
          description:
            "Specifies whether to create standby standby DB data access shard for the DB shard group.",
          type: "number",
          required: false,
        },
        MaxACU: {
          name: "Max ACU",
          description:
            "The maximum capacity of the DB shard group in Aurora capacity units (ACUs).",
          type: "number",
          required: true,
        },
        MinACU: {
          name: "Min ACU",
          description:
            "The minimum capacity of the DB shard group in Aurora capacity units (ACUs).",
          type: "number",
          required: false,
        },
        PubliclyAccessible: {
          name: "Publicly Accessible",
          description:
            "Specifies whether the DB shard group is publicly accessible.",
          type: "boolean",
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

        const command = new CreateDBShardGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Shard Group Result",
      description: "Result from CreateDBShardGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBShardGroupResourceId: {
            type: "string",
            description:
              "The Amazon Web Services Region-unique, immutable identifier for the DB shard group.",
          },
          DBShardGroupIdentifier: {
            type: "string",
            description: "The name of the DB shard group.",
          },
          DBClusterIdentifier: {
            type: "string",
            description:
              "The name of the primary DB cluster for the DB shard group.",
          },
          MaxACU: {
            type: "number",
            description:
              "The maximum capacity of the DB shard group in Aurora capacity units (ACUs).",
          },
          MinACU: {
            type: "number",
            description:
              "The minimum capacity of the DB shard group in Aurora capacity units (ACUs).",
          },
          ComputeRedundancy: {
            type: "number",
            description:
              "Specifies whether to create standby DB shard groups for the DB shard group.",
          },
          Status: {
            type: "string",
            description: "The status of the DB shard group.",
          },
          PubliclyAccessible: {
            type: "boolean",
            description:
              "Indicates whether the DB shard group is publicly accessible.",
          },
          Endpoint: {
            type: "string",
            description: "The connection endpoint for the DB shard group.",
          },
          DBShardGroupArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) for the DB shard group.",
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
            description: "A list of tags.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBShardGroup;
