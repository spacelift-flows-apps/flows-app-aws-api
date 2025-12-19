import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  DeletePodIdentityAssociationCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deletePodIdentityAssociation: AppBlock = {
  name: "Delete Pod Identity Association",
  description: `Deletes a EKS Pod Identity association.`,
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
          description: "The cluster name that",
          type: "string",
          required: true,
        },
        associationId: {
          name: "association Id",
          description: "The ID of the association to be deleted.",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeletePodIdentityAssociationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Pod Identity Association Result",
      description: "Result from DeletePodIdentityAssociation operation",
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
            description:
              "The full description of the EKS Pod Identity association that was deleted.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deletePodIdentityAssociation;
