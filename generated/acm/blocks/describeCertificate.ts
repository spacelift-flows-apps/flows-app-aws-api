import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, DescribeCertificateCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCertificate: AppBlock = {
  name: "Describe Certificate",
  description: `Returns detailed metadata about the specified ACM certificate.`,
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
          description: "The Amazon Resource Name (ARN) of the ACM certificate.",
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

        const command = new DescribeCertificateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Certificate Result",
      description: "Result from DescribeCertificate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Certificate: {
            type: "object",
            properties: {
              CertificateArn: {
                type: "string",
              },
              DomainName: {
                type: "string",
              },
              SubjectAlternativeNames: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ManagedBy: {
                type: "string",
              },
              DomainValidationOptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    DomainName: {
                      type: "string",
                    },
                    ValidationEmails: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ValidationDomain: {
                      type: "string",
                    },
                    ValidationStatus: {
                      type: "string",
                    },
                    ResourceRecord: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Name", "Type", "Value"],
                      additionalProperties: false,
                    },
                    HttpRedirect: {
                      type: "object",
                      properties: {
                        RedirectFrom: {
                          type: "object",
                          additionalProperties: true,
                        },
                        RedirectTo: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    ValidationMethod: {
                      type: "string",
                    },
                  },
                  required: ["DomainName"],
                  additionalProperties: false,
                },
              },
              Serial: {
                type: "string",
              },
              Subject: {
                type: "string",
              },
              Issuer: {
                type: "string",
              },
              CreatedAt: {
                type: "string",
              },
              IssuedAt: {
                type: "string",
              },
              ImportedAt: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              RevokedAt: {
                type: "string",
              },
              RevocationReason: {
                type: "string",
              },
              NotBefore: {
                type: "string",
              },
              NotAfter: {
                type: "string",
              },
              KeyAlgorithm: {
                type: "string",
              },
              SignatureAlgorithm: {
                type: "string",
              },
              InUseBy: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              FailureReason: {
                type: "string",
              },
              Type: {
                type: "string",
              },
              RenewalSummary: {
                type: "object",
                properties: {
                  RenewalStatus: {
                    type: "string",
                  },
                  DomainValidationOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        DomainName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ValidationEmails: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ValidationDomain: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ValidationStatus: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceRecord: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpRedirect: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ValidationMethod: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["DomainName"],
                      additionalProperties: false,
                    },
                  },
                  RenewalStatusReason: {
                    type: "string",
                  },
                  UpdatedAt: {
                    type: "string",
                  },
                },
                required: [
                  "RenewalStatus",
                  "DomainValidationOptions",
                  "UpdatedAt",
                ],
                additionalProperties: false,
              },
              KeyUsages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ExtendedKeyUsages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    OID: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              CertificateAuthorityArn: {
                type: "string",
              },
              RenewalEligibility: {
                type: "string",
              },
              Options: {
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
            },
            additionalProperties: false,
            description: "Metadata about an ACM certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCertificate;
