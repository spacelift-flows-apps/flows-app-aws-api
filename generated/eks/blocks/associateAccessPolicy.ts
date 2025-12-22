import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, AssociateAccessPolicyCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateAccessPolicy: AppBlock = {
  name: "Associate Access Policy",
  description: `Associates an access policy and its scope to an access entry.`,
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
        clusterName: {
          name: "cluster Name",
          description: "The name of your cluster.",
          type: "string",
          required: true,
        },
        principalArn: {
          name: "principal Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM user or role for the AccessEntry that you're associating the access policy to.",
          type: "string",
          required: true,
        },
        policyArn: {
          name: "policy Arn",
          description: "The ARN of the AccessPolicy that you're associating.",
          type: "string",
          required: true,
        },
        accessScope: {
          name: "access Scope",
          description: "The scope for the AccessPolicy.",
          type: {
            type: "object",
            properties: {
              type: {
                type: "string",
              },
              namespaces: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: true,
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AssociateAccessPolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Access Policy Result",
      description: "Result from AssociateAccessPolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          clusterName: {
            type: "string",
            description: "The name of your cluster.",
          },
          principalArn: {
            type: "string",
            description: "The ARN of the IAM principal for the AccessEntry.",
          },
          associatedAccessPolicy: {
            type: "object",
            properties: {
              policyArn: {
                type: "string",
              },
              accessScope: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                  },
                  namespaces: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                additionalProperties: false,
              },
              associatedAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The AccessPolicy and scope associated to the AccessEntry.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateAccessPolicy;
