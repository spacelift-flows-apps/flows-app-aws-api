import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  CreatePodIdentityAssociationCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPodIdentityAssociation: AppBlock = {
  name: "Create Pod Identity Association",
  description: `Creates an EKS Pod Identity association between a service account in an Amazon EKS cluster and an IAM role with EKS Pod Identity.`,
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
          description:
            "The name of the cluster to create the EKS Pod Identity association in.",
          type: "string",
          required: true,
        },
        namespace: {
          name: "namespace",
          description:
            "The name of the Kubernetes namespace inside the cluster to create the EKS Pod Identity association in.",
          type: "string",
          required: true,
        },
        serviceAccount: {
          name: "service Account",
          description:
            "The name of the Kubernetes service account inside the cluster to associate the IAM credentials with.",
          type: "string",
          required: true,
        },
        roleArn: {
          name: "role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role to associate with the service account.",
          type: "string",
          required: true,
        },
        clientRequestToken: {
          name: "client Request Token",
          description:
            "A unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
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
        disableSessionTags: {
          name: "disable Session Tags",
          description:
            "Disable the automatic sessions tags that are appended by EKS Pod Identity.",
          type: "boolean",
          required: false,
        },
        targetRoleArn: {
          name: "target Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the target IAM role to associate with the service account.",
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

        const command = new CreatePodIdentityAssociationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Pod Identity Association Result",
      description: "Result from CreatePodIdentityAssociation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          association: {
            type: "object",
            properties: {
              clusterName: {
                type: "string",
              },
              namespace: {
                type: "string",
              },
              serviceAccount: {
                type: "string",
              },
              roleArn: {
                type: "string",
              },
              associationArn: {
                type: "string",
              },
              associationId: {
                type: "string",
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              createdAt: {
                type: "string",
              },
              modifiedAt: {
                type: "string",
              },
              ownerArn: {
                type: "string",
              },
              disableSessionTags: {
                type: "boolean",
              },
              targetRoleArn: {
                type: "string",
              },
              externalId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The full description of your new association.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPodIdentityAssociation;
