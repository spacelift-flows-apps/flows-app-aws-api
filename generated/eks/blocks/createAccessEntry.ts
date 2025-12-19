import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, CreateAccessEntryCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createAccessEntry: AppBlock = {
  name: "Create Access Entry",
  description: `Creates an access entry.`,
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
          description: "The ARN of the IAM principal for the AccessEntry.",
          type: "string",
          required: true,
        },
        kubernetesGroups: {
          name: "kubernetes Groups",
          description:
            "The value for name that you've specified for kind: Group as a subject in a Kubernetes RoleBinding or ClusterRoleBinding object.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        tags: {
          name: "tags",
          description:
            "Metadata that assists with categorization and organization.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        clientRequestToken: {
          name: "client Request Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        username: {
          name: "username",
          description: "The username to authenticate to Kubernetes with.",
          type: "string",
          required: false,
        },
        type: {
          name: "type",
          description: "The type of the new access entry.",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateAccessEntryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Access Entry Result",
      description: "Result from CreateAccessEntry operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          accessEntry: {
            type: "object",
            properties: {
              clusterName: {
                type: "string",
              },
              principalArn: {
                type: "string",
              },
              kubernetesGroups: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              accessEntryArn: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              username: {
                type: "string",
              },
              type: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "An access entry allows an IAM principal (user or role) to access your cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createAccessEntry;
