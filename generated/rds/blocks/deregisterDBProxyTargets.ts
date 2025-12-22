import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DeregisterDBProxyTargetsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deregisterDBProxyTargets: AppBlock = {
  name: "Deregister DB Proxy Targets",
  description: `Remove the association between one or more DBProxyTarget data structures and a DBProxyTargetGroup.`,
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
        DBProxyName: {
          name: "DB Proxy Name",
          description:
            "The identifier of the DBProxy that is associated with the DBProxyTargetGroup.",
          type: "string",
          required: true,
        },
        TargetGroupName: {
          name: "Target Group Name",
          description: "The identifier of the DBProxyTargetGroup.",
          type: "string",
          required: false,
        },
        DBInstanceIdentifiers: {
          name: "DB Instance Identifiers",
          description: "One or more DB instance identifiers.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        DBClusterIdentifiers: {
          name: "DB Cluster Identifiers",
          description: "One or more DB cluster identifiers.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeregisterDBProxyTargetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Deregister DB Proxy Targets Result",
      description: "Result from DeregisterDBProxyTargets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default deregisterDBProxyTargets;
