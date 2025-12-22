import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  RevokeClusterSecurityGroupIngressCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const revokeClusterSecurityGroupIngress: AppBlock = {
  name: "Revoke Cluster Security Group Ingress",
  description: `Revokes an ingress rule in an Amazon Redshift security group for a previously authorized IP range or Amazon EC2 security group.`,
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
        ClusterSecurityGroupName: {
          name: "Cluster Security Group Name",
          description:
            "The name of the security Group from which to revoke the ingress rule.",
          type: "string",
          required: true,
        },
        CIDRIP: {
          name: "CIDRIP",
          description: "The IP range for which to revoke access.",
          type: "string",
          required: false,
        },
        EC2SecurityGroupName: {
          name: "EC2Security Group Name",
          description:
            "The name of the EC2 Security Group whose access is to be revoked.",
          type: "string",
          required: false,
        },
        EC2SecurityGroupOwnerId: {
          name: "EC2Security Group Owner Id",
          description:
            "The Amazon Web Services account number of the owner of the security group specified in the EC2SecurityGroupName parameter.",
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

        const command = new RevokeClusterSecurityGroupIngressCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Revoke Cluster Security Group Ingress Result",
      description: "Result from RevokeClusterSecurityGroupIngress operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClusterSecurityGroup: {
            type: "object",
            properties: {
              ClusterSecurityGroupName: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              EC2SecurityGroups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Status: {
                      type: "string",
                    },
                    EC2SecurityGroupName: {
                      type: "string",
                    },
                    EC2SecurityGroupOwnerId: {
                      type: "string",
                    },
                    Tags: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              IPRanges: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Status: {
                      type: "string",
                    },
                    CIDRIP: {
                      type: "string",
                    },
                    Tags: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              Tags: {
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
            description: "Describes a security group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default revokeClusterSecurityGroupIngress;
