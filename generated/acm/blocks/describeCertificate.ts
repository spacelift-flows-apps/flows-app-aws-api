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
                enum: ["CLOUDFRONT"],
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
                        type: "string",
                      },
                    },
                    ValidationDomain: {
                      type: "string",
                    },
                    ValidationStatus: {
                      type: "string",
                      enum: ["PENDING_VALIDATION", "SUCCESS", "FAILED"],
                    },
                    ResourceRecord: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "string",
                        },
                        Type: {
                          type: "string",
                          enum: ["CNAME"],
                        },
                        Value: {
                          type: "string",
                        },
                      },
                      required: ["Name", "Type", "Value"],
                      additionalProperties: false,
                    },
                    HttpRedirect: {
                      type: "object",
                      properties: {
                        RedirectFrom: {
                          type: "string",
                        },
                        RedirectTo: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    ValidationMethod: {
                      type: "string",
                      enum: ["EMAIL", "DNS", "HTTP"],
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
                enum: [
                  "PENDING_VALIDATION",
                  "ISSUED",
                  "INACTIVE",
                  "EXPIRED",
                  "VALIDATION_TIMED_OUT",
                  "REVOKED",
                  "FAILED",
                ],
              },
              RevokedAt: {
                type: "string",
              },
              RevocationReason: {
                type: "string",
                enum: [
                  "UNSPECIFIED",
                  "KEY_COMPROMISE",
                  "CA_COMPROMISE",
                  "AFFILIATION_CHANGED",
                  "SUPERCEDED",
                  "SUPERSEDED",
                  "CESSATION_OF_OPERATION",
                  "CERTIFICATE_HOLD",
                  "REMOVE_FROM_CRL",
                  "PRIVILEGE_WITHDRAWN",
                  "A_A_COMPROMISE",
                ],
              },
              NotBefore: {
                type: "string",
              },
              NotAfter: {
                type: "string",
              },
              KeyAlgorithm: {
                type: "string",
                enum: [
                  "RSA_1024",
                  "RSA_2048",
                  "RSA_3072",
                  "RSA_4096",
                  "EC_prime256v1",
                  "EC_secp384r1",
                  "EC_secp521r1",
                ],
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
                enum: [
                  "NO_AVAILABLE_CONTACTS",
                  "ADDITIONAL_VERIFICATION_REQUIRED",
                  "DOMAIN_NOT_ALLOWED",
                  "INVALID_PUBLIC_DOMAIN",
                  "DOMAIN_VALIDATION_DENIED",
                  "CAA_ERROR",
                  "PCA_LIMIT_EXCEEDED",
                  "PCA_INVALID_ARN",
                  "PCA_INVALID_STATE",
                  "PCA_REQUEST_FAILED",
                  "PCA_NAME_CONSTRAINTS_VALIDATION",
                  "PCA_RESOURCE_NOT_FOUND",
                  "PCA_INVALID_ARGS",
                  "PCA_INVALID_DURATION",
                  "PCA_ACCESS_DENIED",
                  "SLR_NOT_FOUND",
                  "OTHER",
                ],
              },
              Type: {
                type: "string",
                enum: ["IMPORTED", "AMAZON_ISSUED", "PRIVATE"],
              },
              RenewalSummary: {
                type: "object",
                properties: {
                  RenewalStatus: {
                    type: "string",
                    enum: [
                      "PENDING_AUTO_RENEWAL",
                      "PENDING_VALIDATION",
                      "SUCCESS",
                      "FAILED",
                    ],
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
                          items: {},
                        },
                        ValidationDomain: {
                          type: "string",
                        },
                        ValidationStatus: {
                          type: "string",
                          enum: ["PENDING_VALIDATION", "SUCCESS", "FAILED"],
                        },
                        ResourceRecord: {
                          type: "object",
                          properties: {
                            Name: {},
                            Type: {},
                            Value: {},
                          },
                          required: ["Name", "Type", "Value"],
                          additionalProperties: false,
                        },
                        HttpRedirect: {
                          type: "object",
                          properties: {
                            RedirectFrom: {},
                            RedirectTo: {},
                          },
                          additionalProperties: false,
                        },
                        ValidationMethod: {
                          type: "string",
                          enum: ["EMAIL", "DNS", "HTTP"],
                        },
                      },
                      required: ["DomainName"],
                      additionalProperties: false,
                    },
                  },
                  RenewalStatusReason: {
                    type: "string",
                    enum: [
                      "NO_AVAILABLE_CONTACTS",
                      "ADDITIONAL_VERIFICATION_REQUIRED",
                      "DOMAIN_NOT_ALLOWED",
                      "INVALID_PUBLIC_DOMAIN",
                      "DOMAIN_VALIDATION_DENIED",
                      "CAA_ERROR",
                      "PCA_LIMIT_EXCEEDED",
                      "PCA_INVALID_ARN",
                      "PCA_INVALID_STATE",
                      "PCA_REQUEST_FAILED",
                      "PCA_NAME_CONSTRAINTS_VALIDATION",
                      "PCA_RESOURCE_NOT_FOUND",
                      "PCA_INVALID_ARGS",
                      "PCA_INVALID_DURATION",
                      "PCA_ACCESS_DENIED",
                      "SLR_NOT_FOUND",
                      "OTHER",
                    ],
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
                      enum: [
                        "DIGITAL_SIGNATURE",
                        "NON_REPUDIATION",
                        "KEY_ENCIPHERMENT",
                        "DATA_ENCIPHERMENT",
                        "KEY_AGREEMENT",
                        "CERTIFICATE_SIGNING",
                        "CRL_SIGNING",
                        "ENCIPHER_ONLY",
                        "DECIPHER_ONLY",
                        "ANY",
                        "CUSTOM",
                      ],
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
                      enum: [
                        "TLS_WEB_SERVER_AUTHENTICATION",
                        "TLS_WEB_CLIENT_AUTHENTICATION",
                        "CODE_SIGNING",
                        "EMAIL_PROTECTION",
                        "TIME_STAMPING",
                        "OCSP_SIGNING",
                        "IPSEC_END_SYSTEM",
                        "IPSEC_TUNNEL",
                        "IPSEC_USER",
                        "ANY",
                        "NONE",
                        "CUSTOM",
                      ],
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
                enum: ["ELIGIBLE", "INELIGIBLE"],
              },
              Options: {
                type: "object",
                properties: {
                  CertificateTransparencyLoggingPreference: {
                    type: "string",
                    enum: ["ENABLED", "DISABLED"],
                  },
                  Export: {
                    type: "string",
                    enum: ["ENABLED", "DISABLED"],
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
