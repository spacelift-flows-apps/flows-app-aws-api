import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, BacktrackDBClusterCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const backtrackDBCluster: AppBlock = {
  name: "Backtrack DB Cluster",
  description: `Backtracks a DB cluster to a specific time, without creating a new DB cluster.`,
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
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The DB cluster identifier of the DB cluster to be backtracked.",
          type: "string",
          required: true,
        },
        BacktrackTo: {
          name: "Backtrack To",
          description:
            "The timestamp of the time to backtrack the DB cluster to, specified in ISO 8601 format.",
          type: "string",
          required: true,
        },
        Force: {
          name: "Force",
          description:
            "Specifies whether to force the DB cluster to backtrack when binary logging is enabled.",
          type: "boolean",
          required: false,
        },
        UseEarliestTimeOnPointInTimeUnavailable: {
          name: "Use Earliest Time On Point In Time Unavailable",
          description:
            "Specifies whether to backtrack the DB cluster to the earliest possible backtrack time when BacktrackTo is set to a timestamp earlier than the earliest backtrack time.",
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

        const command = new BacktrackDBClusterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Backtrack DB Cluster Result",
      description: "Result from BacktrackDBCluster operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterIdentifier: {
            type: "string",
            description: "Contains a user-supplied DB cluster identifier.",
          },
          BacktrackIdentifier: {
            type: "string",
            description: "Contains the backtrack identifier.",
          },
          BacktrackTo: {
            type: "string",
            description:
              "The timestamp of the time to which the DB cluster was backtracked.",
          },
          BacktrackedFrom: {
            type: "string",
            description:
              "The timestamp of the time from which the DB cluster was backtracked.",
          },
          BacktrackRequestCreationTime: {
            type: "string",
            description:
              "The timestamp of the time at which the backtrack was requested.",
          },
          Status: {
            type: "string",
            description: "The status of the backtrack.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default backtrackDBCluster;
