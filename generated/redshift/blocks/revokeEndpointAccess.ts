import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  RevokeEndpointAccessCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const revokeEndpointAccess: AppBlock = {
  name: "Revoke Endpoint Access",
  description: `Revokes access to a cluster.`,
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
          description: "The cluster to revoke access from.",
          type: "string",
          required: false,
        },
        Account: {
          name: "Account",
          description:
            "The Amazon Web Services account ID whose access is to be revoked.",
          type: "string",
          required: false,
        },
        VpcIds: {
          name: "Vpc Ids",
          description:
            "The virtual private cloud (VPC) identifiers for which access is to be revoked.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Force: {
          name: "Force",
          description: "Indicates whether to force the revoke action.",
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

        const command = new RevokeEndpointAccessCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Revoke Endpoint Access Result",
      description: "Result from RevokeEndpointAccess operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Grantor: {
            type: "string",
            description:
              "The Amazon Web Services account ID of the cluster owner.",
          },
          Grantee: {
            type: "string",
            description:
              "The Amazon Web Services account ID of the grantee of the cluster.",
          },
          ClusterIdentifier: {
            type: "string",
            description: "The cluster identifier.",
          },
          AuthorizeTime: {
            type: "string",
            description: "The time (UTC) when the authorization was created.",
          },
          ClusterStatus: {
            type: "string",
            description: "The status of the cluster.",
          },
          Status: {
            type: "string",
            description: "The status of the authorization action.",
          },
          AllowedAllVPCs: {
            type: "boolean",
            description:
              "Indicates whether all VPCs in the grantee account are allowed access to the cluster.",
          },
          AllowedVPCs: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The VPCs allowed access to the cluster.",
          },
          EndpointCount: {
            type: "number",
            description:
              "The number of Redshift-managed VPC endpoints created for the authorization.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default revokeEndpointAccess;
