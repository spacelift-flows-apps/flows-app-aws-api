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
                                oneOf: [
                                  {
                                    type: "object",
                                    properties: {
                                      And: {},
                                    },
                                    required: ["And"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Or: {},
                                    },
                                    required: ["Or"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Not: {},
                                    },
                                    required: ["Not"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Filter: {},
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
                                      And: {},
                                    },
                                    required: ["And"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Or: {},
                                    },
                                    required: ["Or"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Not: {},
                                    },
                                    required: ["Not"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Filter: {},
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
                                      items: {},
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
                                      items: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            CertificateArn: {},
                                          },
                                          required: ["CertificateArn"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            X509AttributeFilter: {},
                                          },
                                          required: ["X509AttributeFilter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            AcmCertificateMetadataFilter: {},
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
                                            Subject: {},
                                          },
                                          required: ["Subject"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            SubjectAlternativeName: {},
                                          },
                                          required: ["SubjectAlternativeName"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ExtendedKeyUsage: {},
                                          },
                                          required: ["ExtendedKeyUsage"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            KeyUsage: {},
                                          },
                                          required: ["KeyUsage"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            KeyAlgorithm: {},
                                          },
                                          required: ["KeyAlgorithm"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            SerialNumber: {},
                                          },
                                          required: ["SerialNumber"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            NotAfter: {},
                                          },
                                          required: ["NotAfter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            NotBefore: {},
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
                                            Status: {},
                                          },
                                          required: ["Status"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            RenewalStatus: {},
                                          },
                                          required: ["RenewalStatus"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Type: {},
                                          },
                                          required: ["Type"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            InUse: {},
                                          },
                                          required: ["InUse"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Exported: {},
                                          },
                                          required: ["Exported"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ExportOption: {},
                                          },
                                          required: ["ExportOption"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ManagedBy: {},
                                          },
                                          required: ["ManagedBy"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ValidationMethod: {},
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
                                oneOf: [
                                  {
                                    type: "object",
                                    properties: {
                                      And: {},
                                    },
                                    required: ["And"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Or: {},
                                    },
                                    required: ["Or"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Not: {},
                                    },
                                    required: ["Not"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Filter: {},
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
                                      And: {},
                                    },
                                    required: ["And"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Or: {},
                                    },
                                    required: ["Or"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Not: {},
                                    },
                                    required: ["Not"],
                                    additionalProperties: false,
                                  },
                                  {
                                    type: "object",
                                    properties: {
                                      Filter: {},
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
                                      items: {},
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
                                      items: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            CertificateArn: {},
                                          },
                                          required: ["CertificateArn"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            X509AttributeFilter: {},
                                          },
                                          required: ["X509AttributeFilter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            AcmCertificateMetadataFilter: {},
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
                                            Subject: {},
                                          },
                                          required: ["Subject"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            SubjectAlternativeName: {},
                                          },
                                          required: ["SubjectAlternativeName"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ExtendedKeyUsage: {},
                                          },
                                          required: ["ExtendedKeyUsage"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            KeyUsage: {},
                                          },
                                          required: ["KeyUsage"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            KeyAlgorithm: {},
                                          },
                                          required: ["KeyAlgorithm"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            SerialNumber: {},
                                          },
                                          required: ["SerialNumber"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            NotAfter: {},
                                          },
                                          required: ["NotAfter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            NotBefore: {},
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
                                            Status: {},
                                          },
                                          required: ["Status"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            RenewalStatus: {},
                                          },
                                          required: ["RenewalStatus"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Type: {},
                                          },
                                          required: ["Type"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            InUse: {},
                                          },
                                          required: ["InUse"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Exported: {},
                                          },
                                          required: ["Exported"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ExportOption: {},
                                          },
                                          required: ["ExportOption"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ManagedBy: {},
                                          },
                                          required: ["ManagedBy"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            ValidationMethod: {},
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
                                      type: "array",
                                      items: {},
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
                                      items: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            CertificateArn: {},
                                          },
                                          required: ["CertificateArn"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            X509AttributeFilter: {},
                                          },
                                          required: ["X509AttributeFilter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            AcmCertificateMetadataFilter: {},
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
                                      items: {},
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
                                      items: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            CertificateArn: {},
                                          },
                                          required: ["CertificateArn"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            X509AttributeFilter: {},
                                          },
                                          required: ["X509AttributeFilter"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            AcmCertificateMetadataFilter: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            And: {},
                                          },
                                          required: ["And"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Or: {},
                                          },
                                          required: ["Or"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Not: {},
                                          },
                                          required: ["Not"],
                                          additionalProperties: false,
                                        },
                                        {
                                          type: "object",
                                          properties: {
                                            Filter: {},
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
                                            items: {},
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
                                            items: {},
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
                                                  And: {},
                                                },
                                                required: ["And"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  Or: {},
                                                },
                                                required: ["Or"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  Not: {},
                                                },
                                                required: ["Not"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  Filter: {},
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
                                                  CertificateArn: {},
                                                },
                                                required: ["CertificateArn"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  X509AttributeFilter: {},
                                                },
                                                required: [
                                                  "X509AttributeFilter",
                                                ],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  AcmCertificateMetadataFilter:
                                                    {},
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
                                                  Subject: {},
                                                },
                                                required: ["Subject"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  SubjectAlternativeName: {},
                                                },
                                                required: [
                                                  "SubjectAlternativeName",
                                                ],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  ExtendedKeyUsage: {},
                                                },
                                                required: ["ExtendedKeyUsage"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  KeyUsage: {},
                                                },
                                                required: ["KeyUsage"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  KeyAlgorithm: {},
                                                },
                                                required: ["KeyAlgorithm"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  SerialNumber: {},
                                                },
                                                required: ["SerialNumber"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  NotAfter: {},
                                                },
                                                required: ["NotAfter"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  NotBefore: {},
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
                                                  Status: {},
                                                },
                                                required: ["Status"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  RenewalStatus: {},
                                                },
                                                required: ["RenewalStatus"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  Type: {},
                                                },
                                                required: ["Type"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  InUse: {},
                                                },
                                                required: ["InUse"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  Exported: {},
                                                },
                                                required: ["Exported"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  ExportOption: {},
                                                },
                                                required: ["ExportOption"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  ManagedBy: {},
                                                },
                                                required: ["ManagedBy"],
                                                additionalProperties: false,
                                              },
                                              {
                                                type: "object",
                                                properties: {
                                                  ValidationMethod: {},
                                                },
                                                required: ["ValidationMethod"],
                                                additionalProperties: false,
                                              },
                                            ],
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
                                            oneOf: [
                                              {
                                                type: "object",
                                                properties: {
                                                  CommonName: {},
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
                                                  DnsName: {},
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
                                              Start: {},
                                              End: {},
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
                                              Start: {},
                                              End: {},
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
                                            properties: {
                                              Value: {},
                                              ComparisonOperator: {},
                                            },
                                            required: [
                                              "Value",
                                              "ComparisonOperator",
                                            ],
                                            additionalProperties: false,
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
                                            properties: {
                                              Value: {},
                                              ComparisonOperator: {},
                                            },
                                            required: [
                                              "Value",
                                              "ComparisonOperator",
                                            ],
                                            additionalProperties: false,
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
                                        type: "string",
                                      },
                                      End: {
                                        type: "string",
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
                                        type: "string",
                                      },
                                      End: {
                                        type: "string",
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
                          type: "string",
                        },
                        DomainComponents: {
                          type: "array",
                          items: {},
                        },
                        Country: {
                          type: "string",
                        },
                        CustomAttributes: {
                          type: "array",
                          items: {},
                        },
                        DistinguishedNameQualifier: {
                          type: "string",
                        },
                        GenerationQualifier: {
                          type: "string",
                        },
                        GivenName: {
                          type: "string",
                        },
                        Initials: {
                          type: "string",
                        },
                        Locality: {
                          type: "string",
                        },
                        Organization: {
                          type: "string",
                        },
                        OrganizationalUnit: {
                          type: "string",
                        },
                        Pseudonym: {
                          type: "string",
                        },
                        SerialNumber: {
                          type: "string",
                        },
                        State: {
                          type: "string",
                        },
                        Surname: {
                          type: "string",
                        },
                        Title: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    Subject: {
                      type: "object",
                      properties: {
                        CommonName: {
                          type: "string",
                        },
                        DomainComponents: {
                          type: "array",
                          items: {},
                        },
                        Country: {
                          type: "string",
                        },
                        CustomAttributes: {
                          type: "array",
                          items: {},
                        },
                        DistinguishedNameQualifier: {
                          type: "string",
                        },
                        GenerationQualifier: {
                          type: "string",
                        },
                        GivenName: {
                          type: "string",
                        },
                        Initials: {
                          type: "string",
                        },
                        Locality: {
                          type: "string",
                        },
                        Organization: {
                          type: "string",
                        },
                        OrganizationalUnit: {
                          type: "string",
                        },
                        Pseudonym: {
                          type: "string",
                        },
                        SerialNumber: {
                          type: "string",
                        },
                        State: {
                          type: "string",
                        },
                        Surname: {
                          type: "string",
                        },
                        Title: {
                          type: "string",
                        },
                      },
                      additionalProperties: false,
                    },
                    SubjectAlternativeNames: {
                      type: "array",
                      items: {
                        oneOf: [
                          {
                            type: "object",
                            properties: {
                              DirectoryName: {},
                            },
                            required: ["DirectoryName"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              DnsName: {},
                            },
                            required: ["DnsName"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              IpAddress: {},
                            },
                            required: ["IpAddress"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              OtherName: {},
                            },
                            required: ["OtherName"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              RegisteredId: {},
                            },
                            required: ["RegisteredId"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              Rfc822Name: {},
                            },
                            required: ["Rfc822Name"],
                            additionalProperties: false,
                          },
                          {
                            type: "object",
                            properties: {
                              UniformResourceIdentifier: {},
                            },
                            required: ["UniformResourceIdentifier"],
                            additionalProperties: false,
                          },
                        ],
                      },
                    },
                    ExtendedKeyUsages: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    KeyAlgorithm: {
                      type: "string",
                    },
                    KeyUsages: {
                      type: "array",
                      items: {
                        type: "string",
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
                              type: "string",
                            },
                            Exported: {
                              type: "boolean",
                            },
                            ImportedAt: {
                              type: "string",
                            },
                            InUse: {
                              type: "boolean",
                            },
                            IssuedAt: {
                              type: "string",
                            },
                            RenewalEligibility: {
                              type: "string",
                            },
                            RevokedAt: {
                              type: "string",
                            },
                            Status: {
                              type: "string",
                            },
                            RenewalStatus: {
                              type: "string",
                            },
                            Type: {
                              type: "string",
                            },
                            ExportOption: {
                              type: "string",
                            },
                            ManagedBy: {
                              type: "string",
                            },
                            ValidationMethod: {
                              type: "string",
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
