import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, ListCertificatesCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCertificates: AppBlock = {
  name: "List Certificates",
  description: `Retrieves a list of certificate ARNs and domain names.`,
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
        CertificateStatuses: {
          name: "Certificate Statuses",
          description: "Filter the certificate list by status value.",
          type: {
            type: "array",
            items: {
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
          },
          required: false,
        },
        Includes: {
          name: "Includes",
          description: "Filter the certificate list.",
          type: {
            type: "object",
            properties: {
              extendedKeyUsage: {
                type: "array",
                items: {
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
              },
              keyUsage: {
                type: "array",
                items: {
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
              keyTypes: {
                type: "array",
                items: {
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
              },
              exportOption: {
                type: "string",
                enum: ["ENABLED", "DISABLED"],
              },
              managedBy: {
                type: "string",
                enum: ["CLOUDFRONT"],
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Use this parameter only when paginating results and only in a subsequent request after you receive a response with truncated results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "Use this parameter when paginating results to specify the maximum number of items to return in the response.",
          type: "number",
          required: false,
        },
        SortBy: {
          name: "Sort By",
          description: "Specifies the field to sort results by.",
          type: {
            type: "string",
            enum: ["CREATED_AT"],
          },
          required: false,
        },
        SortOrder: {
          name: "Sort Order",
          description: "Specifies the order of sorted results.",
          type: {
            type: "string",
            enum: ["ASCENDING", "DESCENDING"],
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

        const command = new ListCertificatesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Certificates Result",
      description: "Result from ListCertificates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "When the list is truncated, this value is present and contains the value to use for the NextToken parameter in a subsequent pagination request.",
          },
          CertificateSummaryList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CertificateArn: {
                  type: "string",
                },
                DomainName: {
                  type: "string",
                },
                SubjectAlternativeNameSummaries: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                HasAdditionalSubjectAlternativeNames: {
                  type: "boolean",
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
                Type: {
                  type: "string",
                  enum: ["IMPORTED", "AMAZON_ISSUED", "PRIVATE"],
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
                KeyUsages: {
                  type: "array",
                  items: {
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
                ExtendedKeyUsages: {
                  type: "array",
                  items: {
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
                },
                ExportOption: {
                  type: "string",
                  enum: ["ENABLED", "DISABLED"],
                },
                InUse: {
                  type: "boolean",
                },
                Exported: {
                  type: "boolean",
                },
                RenewalEligibility: {
                  type: "string",
                  enum: ["ELIGIBLE", "INELIGIBLE"],
                },
                NotBefore: {
                  type: "string",
                },
                NotAfter: {
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
                RevokedAt: {
                  type: "string",
                },
                ManagedBy: {
                  type: "string",
                  enum: ["CLOUDFRONT"],
                },
              },
              additionalProperties: false,
            },
            description: "A list of ACM certificates.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listCertificates;
