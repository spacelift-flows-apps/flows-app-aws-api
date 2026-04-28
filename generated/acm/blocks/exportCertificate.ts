import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, ExportCertificateCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const exportCertificate: AppBlock = {
  name: "Export Certificate",
  description: `Exports a private certificate issued by a private certificate authority (CA) or a public certificate for use anywhere.`,
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
        CertificateArn: {
          name: "Certificate Arn",
          description:
            "An Amazon Resource Name (ARN) of the issued certificate.",
          type: "string",
          required: true,
        },
        Passphrase: {
          name: "Passphrase",
          description:
            "Passphrase to associate with the encrypted exported private key.",
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

        const client = new ACMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ExportCertificateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Export Certificate Result",
      description: "Result from ExportCertificate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Certificate: {
            type: "string",
            description: "The base64 PEM-encoded certificate.",
          },
          CertificateChain: {
            type: "string",
            description: "The base64 PEM-encoded certificate chain.",
          },
          PrivateKey: {
            type: "string",
            description:
              "The encrypted private key associated with the public key in the certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default exportCertificate;
