import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, RebootDBShardGroupCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const rebootDBShardGroup: AppBlock = {
  name: "Reboot DB Shard Group",
  description: `You might need to reboot your DB shard group, usually for maintenance reasons.`,
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
          description: "The name of the DB shard group to reboot.",
          type: "string",
          required: true,
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

        const command = new RebootDBShardGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Reboot DB Shard Group Result",
      description: "Result from RebootDBShardGroup operation",
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

export default rebootDBShardGroup;
