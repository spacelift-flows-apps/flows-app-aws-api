import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  AuthorizeDBSecurityGroupIngressCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const authorizeDBSecurityGroupIngress: AppBlock = {
  name: "Authorize DB Security Group Ingress",
  description: `Enables ingress to a DBSecurityGroup using one of two forms of authorization.`,
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
        DBSecurityGroupName: {
          name: "DB Security Group Name",
          description:
            "The name of the DB security group to add authorization to.",
          type: "string",
          required: true,
        },
        CIDRIP: {
          name: "CIDRIP",
          description: "The IP range to authorize.",
          type: "string",
          required: false,
        },
        EC2SecurityGroupName: {
          name: "EC2Security Group Name",
          description: "Name of the EC2 security group to authorize.",
          type: "string",
          required: false,
        },
        EC2SecurityGroupId: {
          name: "EC2Security Group Id",
          description: "Id of the EC2 security group to authorize.",
          type: "string",
          required: false,
        },
        EC2SecurityGroupOwnerId: {
          name: "EC2Security Group Owner Id",
          description:
            "Amazon Web Services account number of the owner of the EC2 security group specified in the EC2SecurityGroupName parameter.",
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

        const command = new AuthorizeDBSecurityGroupIngressCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Authorize DB Security Group Ingress Result",
      description: "Result from AuthorizeDBSecurityGroupIngress operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBSecurityGroup: {
            type: "object",
            properties: {
              OwnerId: {
                type: "string",
              },
              DBSecurityGroupName: {
                type: "string",
              },
              DBSecurityGroupDescription: {
                type: "string",
              },
              VpcId: {
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
                    EC2SecurityGroupId: {
                      type: "string",
                    },
                    EC2SecurityGroupOwnerId: {
                      type: "string",
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
                  },
                  additionalProperties: false,
                },
              },
              DBSecurityGroupArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains the details for an Amazon RDS DB security group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default authorizeDBSecurityGroupIngress;
