import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, RequestCertificateCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const requestCertificate: AppBlock = {
  name: "Request Certificate",
  description: `Requests an ACM certificate for use with other Amazon Web Services services.`,
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
        DomainName: {
          name: "Domain Name",
          description: "Fully qualified domain name (FQDN), such as www.",
          type: "string",
          required: true,
        },
        ValidationMethod: {
          name: "Validation Method",
          description:
            "The method you want to use if you are requesting a public certificate to validate that you own or control domain.",
          type: "string",
          required: false,
        },
        SubjectAlternativeNames: {
          name: "Subject Alternative Names",
          description:
            "Additional FQDNs to be included in the Subject Alternative Name extension of the ACM certificate.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "Customer chosen string that can be used to distinguish between calls to RequestCertificate.",
          type: "string",
          required: false,
        },
        DomainValidationOptions: {
          name: "Domain Validation Options",
          description:
            "The domain name that you want ACM to use to send you emails so that you can validate domain ownership.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DomainName: {
                  type: "string",
                },
                ValidationDomain: {
                  type: "string",
                },
              },
              required: ["DomainName", "ValidationDomain"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Options: {
          name: "Options",
          description:
            "You can use this parameter to specify whether to add the certificate to a certificate transparency log and export your certificate.",
          type: {
            type: "object",
            properties: {
              CertificateTransparencyLoggingPreference: {
                type: "string",
              },
              Export: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CertificateAuthorityArn: {
          name: "Certificate Authority Arn",
          description:
            "The Amazon Resource Name (ARN) of the private certificate authority (CA) that will be used to issue the certificate.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "One or more resource tags to associate with the certificate.",
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
        KeyAlgorithm: {
          name: "Key Algorithm",
          description:
            "Specifies the algorithm of the public and private key pair that your certificate uses to encrypt data.",
          type: "string",
          required: false,
        },
        ManagedBy: {
          name: "Managed By",
          description:
            "Identifies the Amazon Web Services service that manages the certificate issued by ACM.",
          type: "string",
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

        const command = new RequestCertificateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Request Certificate Result",
      description: "Result from RequestCertificate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CertificateArn: {
            type: "string",
            description:
              "String that contains the ARN of the issued certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default requestCertificate;
