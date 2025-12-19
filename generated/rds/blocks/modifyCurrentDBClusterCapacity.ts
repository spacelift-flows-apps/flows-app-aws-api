import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  ModifyCurrentDBClusterCapacityCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyCurrentDBClusterCapacity: AppBlock = {
  name: "Modify Current DB Cluster Capacity",
  description: `Set the capacity of an Aurora Serverless v1 DB cluster to a specific value.`,
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
            "The DB cluster identifier for the cluster being modified.",
          type: "string",
          required: true,
        },
        Capacity: {
          name: "Capacity",
          description: "The DB cluster capacity.",
          type: "number",
          required: false,
        },
        SecondsBeforeTimeout: {
          name: "Seconds Before Timeout",
          description:
            "The amount of time, in seconds, that Aurora Serverless v1 tries to find a scaling point to perform seamless scaling before enforcing the timeout action.",
          type: "number",
          required: false,
        },
        TimeoutAction: {
          name: "Timeout Action",
          description:
            "The action to take when the timeout is reached, either ForceApplyCapacityChange or RollbackCapacityChange.",
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

        const command = new ModifyCurrentDBClusterCapacityCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Current DB Cluster Capacity Result",
      description: "Result from ModifyCurrentDBClusterCapacity operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterIdentifier: {
            type: "string",
            description: "A user-supplied DB cluster identifier.",
          },
          PendingCapacity: {
            type: "number",
            description:
              "A value that specifies the capacity that the DB cluster scales to next.",
          },
          CurrentCapacity: {
            type: "number",
            description: "The current capacity of the DB cluster.",
          },
          SecondsBeforeTimeout: {
            type: "number",
            description:
              "The number of seconds before a call to ModifyCurrentDBClusterCapacity times out.",
          },
          TimeoutAction: {
            type: "string",
            description:
              "The timeout action of a call to ModifyCurrentDBClusterCapacity, either ForceApplyCapacityChange or RollbackCapacityChange.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyCurrentDBClusterCapacity;
