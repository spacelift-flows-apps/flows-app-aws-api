import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, SearchCertificatesCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const searchCertificates: AppBlock = {
  name: "Search Certificates",
  description: `Retrieves a list of certificates matching search criteria.`,
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
        FilterStatement: {
          name: "Filter Statement",
          description: "A filter statement that defines the search criteria.",
          type: {
            oneOf: [
              {
                type: "object",
                properties: {
                  And: {
                    type: "array",
                    items: {
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            And: {
                              type: "array",
                              items: {
                                type: "object",
                                additionalProperties: true,
                              },
                            },
                          },
                          required: ["And"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Or: {
                              type: "array",
                              items: {
                                type: "object",
                                additionalProperties: true,
                              },
                            },
                          },
                          required: ["Or"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Not: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    And: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["And"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Or: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Or"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Not: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Not"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Filter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Filter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                          required: ["Not"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Filter: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    CertificateArn: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["CertificateArn"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    X509AttributeFilter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["X509AttributeFilter"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    AcmCertificateMetadataFilter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["AcmCertificateMetadataFilter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                          required: ["Filter"],
                          additionalProperties: false,
                        },
                      ],
                    },
                  },
                },
                required: ["And"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  Or: {
                    type: "array",
                    items: {
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            And: {
                              type: "array",
                              items: {
                                type: "object",
                                additionalProperties: true,
                              },
                            },
                          },
                          required: ["And"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Or: {
                              type: "array",
                              items: {
                                type: "object",
                                additionalProperties: true,
                              },
                            },
                          },
                          required: ["Or"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Not: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    And: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["And"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Or: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Or"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Not: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Not"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Filter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Filter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                          required: ["Not"],
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          properties: {
                            Filter: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    CertificateArn: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["CertificateArn"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    X509AttributeFilter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["X509AttributeFilter"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    AcmCertificateMetadataFilter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["AcmCertificateMetadataFilter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                          required: ["Filter"],
                          additionalProperties: false,
                        },
                      ],
                    },
                  },
                },
                required: ["Or"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  Not: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          And: {
                            type: "array",
                            items: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    And: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["And"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Or: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Or"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Not: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Not"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Filter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Filter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                        },
                        required: ["And"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          Or: {
                            type: "array",
                            items: {
                              oneOf: [
                                {
                                  type: "object",
                                  properties: {
                                    And: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["And"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Or: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Or"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Not: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Not"],
                                  additionalProperties: false,
                                },
                                {
                                  type: "object",
                                  properties: {
                                    Filter: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                  required: ["Filter"],
                                  additionalProperties: false,
                                },
                              ],
                            },
                          },
                        },
                        required: ["Or"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          Not: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  And: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                },
                                required: ["And"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  Or: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      additionalProperties: true,
                                    },
                                  },
                                },
                                required: ["Or"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  Not: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          And: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["And"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          Or: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Or"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          Not: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Not"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          Filter: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Filter"],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["Not"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  Filter: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          CertificateArn: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["CertificateArn"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          X509AttributeFilter: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["X509AttributeFilter"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          AcmCertificateMetadataFilter: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: [
                                          "AcmCertificateMetadataFilter",
                                        ],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["Filter"],
                                additionalProperties: false,
                              },
                            ],
                          },
                        },
                        required: ["Not"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          Filter: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  CertificateArn: {
                                    type: "string",
                                  },
                                },
                                required: ["CertificateArn"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  X509AttributeFilter: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          Subject: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Subject"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          SubjectAlternativeName: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["SubjectAlternativeName"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          ExtendedKeyUsage: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["ExtendedKeyUsage"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          KeyUsage: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["KeyUsage"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          KeyAlgorithm: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["KeyAlgorithm"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          SerialNumber: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["SerialNumber"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          NotAfter: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["NotAfter"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          NotBefore: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["NotBefore"],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["X509AttributeFilter"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  AcmCertificateMetadataFilter: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          Status: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Status"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          RenewalStatus: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["RenewalStatus"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          Type: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Type"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          InUse: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["InUse"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          Exported: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["Exported"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          ExportOption: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["ExportOption"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          ManagedBy: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["ManagedBy"],
                                        additionalProperties: false,
                                      },
                                      {
                                        type: "object",
                                        properties: {
                                          ValidationMethod: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["ValidationMethod"],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["AcmCertificateMetadataFilter"],
                                additionalProperties: false,
                              },
                            ],
                          },
                        },
                        required: ["Filter"],
                        additionalProperties: false,
                      },
                    ],
                  },
                },
                required: ["Not"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  Filter: {
                    oneOf: [
                      {
                        type: "object",
                        properties: {
                          CertificateArn: {
                            type: "string",
                          },
                        },
                        required: ["CertificateArn"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          X509AttributeFilter: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  Subject: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          CommonName: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["CommonName"],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["Subject"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  SubjectAlternativeName: {
                                    oneOf: [
                                      {
                                        type: "object",
                                        properties: {
                                          DnsName: {
                                            type: "object",
                                            additionalProperties: true,
                                          },
                                        },
                                        required: ["DnsName"],
                                        additionalProperties: false,
                                      },
                                    ],
                                  },
                                },
                                required: ["SubjectAlternativeName"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  ExtendedKeyUsage: {
                                    type: "string",
                                  },
                                },
                                required: ["ExtendedKeyUsage"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  KeyUsage: {
                                    type: "string",
                                  },
                                },
                                required: ["KeyUsage"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  KeyAlgorithm: {
                                    type: "string",
                                  },
                                },
                                required: ["KeyAlgorithm"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  SerialNumber: {
                                    type: "string",
                                  },
                                },
                                required: ["SerialNumber"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  NotAfter: {
                                    type: "object",
                                    properties: {
                                      Start: {
                                        type: "object",
                                        additionalProperties: true,
                                      },
                                      End: {
                                        type: "object",
                                        additionalProperties: true,
                                      },
                                    },
                                    additionalProperties: false,
                                  },
                                },
                                required: ["NotAfter"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  NotBefore: {
                                    type: "object",
                                    properties: {
                                      Start: {
                                        type: "object",
                                        additionalProperties: true,
                                      },
                                      End: {
                                        type: "object",
                                        additionalProperties: true,
                                      },
                                    },
                                    additionalProperties: false,
                                  },
                                },
                                required: ["NotBefore"],
                                additionalProperties: false,
                              },
                            ],
                          },
                        },
                        required: ["X509AttributeFilter"],
                        additionalProperties: false,
                      },
                      {
                        type: "object",
                        properties: {
                          AcmCertificateMetadataFilter: {
                            oneOf: [
                              {
                                type: "object",
                                properties: {
                                  Status: {
                                    type: "string",
                                  },
                                },
                                required: ["Status"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  RenewalStatus: {
                                    type: "string",
                                  },
                                },
                                required: ["RenewalStatus"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  Type: {
                                    type: "string",
                                  },
                                },
                                required: ["Type"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  InUse: {
                                    type: "boolean",
                                  },
                                },
                                required: ["InUse"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  Exported: {
                                    type: "boolean",
                                  },
                                },
                                required: ["Exported"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  ExportOption: {
                                    type: "string",
                                  },
                                },
                                required: ["ExportOption"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  ManagedBy: {
                                    type: "string",
                                  },
                                },
                                required: ["ManagedBy"],
                                additionalProperties: false,
                              },
                              {
                                type: "object",
                                properties: {
                                  ValidationMethod: {
                                    type: "string",
                                  },
                                },
                                required: ["ValidationMethod"],
                                additionalProperties: false,
                              },
                            ],
                          },
                        },
                        required: ["AcmCertificateMetadataFilter"],
                        additionalProperties: false,
                      },
                    ],
                  },
                },
                required: ["Filter"],
                additionalProperties: false,
              },
            ],
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in the response.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Use this parameter only when paginating results and only in a subsequent request after you receive a response with truncated results.",
          type: "string",
          required: false,
        },
        SortBy: {
          name: "Sort By",
          description: "Specifies the field to sort results by.",
          type: "string",
          required: false,
        },
        SortOrder: {
          name: "Sort Order",
          description: "Specifies the order of sorted results.",
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

        const command = new SearchCertificatesCommand(
          convertTimestamps(commandInput, new Set(["Start", "End"])) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Search Certificates Result",
      description: "Result from SearchCertificates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CertificateArn: {
                  type: "string",
                },
                X509Attributes: {
                  type: "object",
                  properties: {
                    Issuer: {
                      type: "object",
                      properties: {
                        CommonName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DomainComponents: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Country: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CustomAttributes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DistinguishedNameQualifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GenerationQualifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GivenName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Initials: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Locality: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Organization: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OrganizationalUnit: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Pseudonym: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SerialNumber: {
                          type: "object",
                          additionalProperties: true,
                        },
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Surname: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Title: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Subject: {
                      type: "object",
                      properties: {
                        CommonName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DomainComponents: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Country: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CustomAttributes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DistinguishedNameQualifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GenerationQualifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GivenName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Initials: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Locality: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Organization: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OrganizationalUnit: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Pseudonym: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SerialNumber: {
                          type: "object",
                          additionalProperties: true,
                        },
                        State: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Surname: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Title: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    SubjectAlternativeNames: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ExtendedKeyUsages: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    KeyAlgorithm: {
                      type: "string",
                    },
                    KeyUsages: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SerialNumber: {
                      type: "string",
                    },
                    NotAfter: {
                      type: "string",
                    },
                    NotBefore: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                CertificateMetadata: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        AcmCertificateMetadata: {
                          type: "object",
                          properties: {
                            CreatedAt: {
                              type: "object",
                              additionalProperties: true,
                            },
                            Exported: {
                              type: "object",
                              additionalProperties: true,
                            },
                            ImportedAt: {
                              type: "object",
                              additionalProperties: true,
                            },
                            InUse: {
                              type: "object",
                              additionalProperties: true,
                            },
                            IssuedAt: {
                              type: "object",
                              additionalProperties: true,
                            },
                            RenewalEligibility: {
                              type: "object",
                              additionalProperties: true,
                            },
                            RevokedAt: {
                              type: "object",
                              additionalProperties: true,
                            },
                            Status: {
                              type: "object",
                              additionalProperties: true,
                            },
                            RenewalStatus: {
                              type: "object",
                              additionalProperties: true,
                            },
                            Type: {
                              type: "object",
                              additionalProperties: true,
                            },
                            ExportOption: {
                              type: "object",
                              additionalProperties: true,
                            },
                            ManagedBy: {
                              type: "object",
                              additionalProperties: true,
                            },
                            ValidationMethod: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                          additionalProperties: false,
                        },
                      },
                      required: ["AcmCertificateMetadata"],
                      additionalProperties: false,
                    },
                  ],
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of certificate search results containing certificate ARNs, X.",
          },
          NextToken: {
            type: "string",
            description:
              "When the list is truncated, this value is present and contains the value to use for the NextToken parameter in a subsequent pagination request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default searchCertificates;
