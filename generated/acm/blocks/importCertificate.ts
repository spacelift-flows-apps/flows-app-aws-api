import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, ImportCertificateCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const importCertificate: AppBlock = {
  name: "Import Certificate",
  description: `Imports a certificate into Certificate Manager (ACM) to use with services that are integrated with ACM.`,
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
            "The Amazon Resource Name (ARN) of an imported certificate to replace.",
          type: "string",
          required: false,
        },
        Certificate: {
          name: "Certificate",
          description: "The certificate to import.",
          type: "string",
          required: true,
        },
        PrivateKey: {
          name: "Private Key",
          description:
            "The private key that matches the public key in the certificate.",
          type: "string",
          required: true,
        },
        CertificateChain: {
          name: "Certificate Chain",
          description: "The PEM encoded certificate chain.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "One or more resource tags to associate with the imported certificate.",
          type: {
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
              required: ["Key"],
              additionalProperties: false,
            },
          },
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

        const client = new ACMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ImportCertificateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Import Certificate Result",
      description: "Result from ImportCertificate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CertificateArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the imported certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default importCertificate;
