import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  ModifyCustomDomainAssociationCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyCustomDomainAssociation: AppBlock = {
  name: "Modify Custom Domain Association",
  description: `Contains information for changing a custom domain association.`,
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
        CustomDomainName: {
          name: "Custom Domain Name",
          description:
            "The custom domain name for a changed custom domain association.",
          type: "string",
          required: true,
        },
        CustomDomainCertificateArn: {
          name: "Custom Domain Certificate Arn",
          description:
            "The certificate Amazon Resource Name (ARN) for the changed custom domain association.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the cluster to change a custom domain association for.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyCustomDomainAssociationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Custom Domain Association Result",
      description: "Result from ModifyCustomDomainAssociation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CustomDomainName: {
            type: "string",
            description:
              "The custom domain name associated with the result for the changed custom domain association.",
          },
          CustomDomainCertificateArn: {
            type: "string",
            description:
              "The certificate Amazon Resource Name (ARN) associated with the result for the changed custom domain association.",
          },
          ClusterIdentifier: {
            type: "string",
            description:
              "The identifier of the cluster associated with the result for the changed custom domain association.",
          },
          CustomDomainCertExpiryTime: {
            type: "string",
            description:
              "The certificate expiration time associated with the result for the changed custom domain association.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyCustomDomainAssociation;
