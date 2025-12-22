import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  DescribePodIdentityAssociationCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describePodIdentityAssociation: AppBlock = {
  name: "Describe Pod Identity Association",
  description: `Returns descriptive information about an EKS Pod Identity association.`,
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
          description: "The name of the cluster that the association is in.",
          type: "string",
          required: true,
        },
        associationId: {
          name: "association Id",
          description:
            "The ID of the association that you want the description of.",
          type: "string",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribePodIdentityAssociationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Pod Identity Association Result",
      description: "Result from DescribePodIdentityAssociation operation",
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
              "The full description of the EKS Pod Identity association.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describePodIdentityAssociation;
