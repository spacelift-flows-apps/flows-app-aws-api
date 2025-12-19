import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, UploadServerCertificateCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const uploadServerCertificate: AppBlock = {
  name: "Upload Server Certificate",
  description: `Uploads a server certificate entity for the Amazon Web Services account.`,
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
        Path: {
          name: "Path",
          description: "The path for the server certificate.",
          type: "string",
          required: false,
        },
        ServerCertificateName: {
          name: "Server Certificate Name",
          description: "The name for the server certificate.",
          type: "string",
          required: true,
        },
        CertificateBody: {
          name: "Certificate Body",
          description:
            "The contents of the public key certificate in PEM-encoded format.",
          type: "string",
          required: true,
        },
        PrivateKey: {
          name: "Private Key",
          description: "The contents of the private key in PEM-encoded format.",
          type: "string",
          required: true,
        },
        CertificateChain: {
          name: "Certificate Chain",
          description: "The contents of the certificate chain.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the new IAM server certificate resource.",
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
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UploadServerCertificateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Upload Server Certificate Result",
      description: "Result from UploadServerCertificate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServerCertificateMetadata: {
            type: "object",
            properties: {
              Path: {
                type: "string",
              },
              ServerCertificateName: {
                type: "string",
              },
              ServerCertificateId: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              UploadDate: {
                type: "string",
              },
              Expiration: {
                type: "string",
              },
            },
            required: [
              "Path",
              "ServerCertificateName",
              "ServerCertificateId",
              "Arn",
            ],
            additionalProperties: false,
            description:
              "The meta information of the uploaded server certificate without its certificate body, certificate chain, and private key.",
          },
          Tags: {
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
              required: ["Key", "Value"],
              additionalProperties: false,
            },
            description:
              "A list of tags that are attached to the new IAM server certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default uploadServerCertificate;
