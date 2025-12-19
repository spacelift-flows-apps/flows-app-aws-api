import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyCertificatesCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyCertificates: AppBlock = {
  name: "Modify Certificates",
  description: `Override the system-default Secure Sockets Layer/Transport Layer Security (SSL/TLS) certificate for Amazon RDS for new DB instances, or remove the override.`,
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
        CertificateIdentifier: {
          name: "Certificate Identifier",
          description:
            "The new default certificate identifier to override the current one with.",
          type: "string",
          required: false,
        },
        RemoveCustomerOverride: {
          name: "Remove Customer Override",
          description:
            "Specifies whether to remove the override for the default certificate.",
          type: "boolean",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyCertificatesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Certificates Result",
      description: "Result from ModifyCertificates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Certificate: {
            type: "object",
            properties: {
              CertificateIdentifier: {
                type: "string",
              },
              CertificateType: {
                type: "string",
              },
              Thumbprint: {
                type: "string",
              },
              ValidFrom: {
                type: "string",
              },
              ValidTill: {
                type: "string",
              },
              CertificateArn: {
                type: "string",
              },
              CustomerOverride: {
                type: "boolean",
              },
              CustomerOverrideValidTill: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "A CA certificate for an Amazon Web Services account.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyCertificates;
