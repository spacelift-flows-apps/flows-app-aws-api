import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CopyDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const copyDistribution: AppBlock = {
  name: "Copy Distribution",
  description: `Creates a staging distribution using the configuration of the provided primary distribution.`,
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
        PrimaryDistributionId: {
          name: "Primary Distribution Id",
          description:
            "The identifier of the primary distribution whose configuration you are copying.",
          type: "string",
          required: true,
        },
        Staging: {
          name: "Staging",
          description:
            "The type of distribution that your primary distribution will be copied to.",
          type: "boolean",
          required: false,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The version identifier of the primary distribution whose configuration you are copying.",
          type: "string",
          required: false,
        },
        CallerReference: {
          name: "Caller Reference",
          description:
            "A value that uniquely identifies a request to create a resource.",
          type: "string",
          required: true,
        },
        Enabled: {
          name: "Enabled",
          description:
            "A Boolean flag to specify the state of the staging distribution when it's created.",
          type: "boolean",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CopyDistributionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Copy Distribution Result",
      description: "Result from CopyDistribution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Distribution: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              ARN: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              InProgressInvalidationBatches: {
                type: "number",
              },
              DomainName: {
                type: "string",
              },
              ActiveTrustedSigners: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        AwsAccountNumber: {
                          type: "string",
                        },
                        KeyPairIds: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Quantity"],
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Enabled", "Quantity"],
                additionalProperties: false,
              },
              ActiveTrustedKeyGroups: {
                type: "object",
                properties: {
                  Enabled: {
                    type: "boolean",
                  },
                  Quantity: {
                    type: "number",
                  },
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        KeyGroupId: {
                          type: "string",
                        },
                        KeyPairIds: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Quantity"],
                          additionalProperties: false,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                required: ["Enabled", "Quantity"],
                additionalProperties: false,
              },
              DistributionConfig: {
                type: "object",
                properties: {
                  CallerReference: {
                    type: "string",
                  },
                  Aliases: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                  DefaultRootObject: {
                    type: "string",
                  },
                  Origins: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Id: {},
                            DomainName: {},
                            OriginPath: {},
                            CustomHeaders: {},
                            S3OriginConfig: {},
                            CustomOriginConfig: {},
                            VpcOriginConfig: {},
                            ConnectionAttempts: {},
                            ConnectionTimeout: {},
                            ResponseCompletionTimeout: {},
                            OriginShield: {},
                            OriginAccessControlId: {},
                          },
                          required: ["Id", "DomainName"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["Quantity", "Items"],
                    additionalProperties: false,
                  },
                  OriginGroups: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Id: {},
                            FailoverCriteria: {},
                            Members: {},
                            SelectionCriteria: {},
                          },
                          required: ["Id", "FailoverCriteria", "Members"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                  DefaultCacheBehavior: {
                    type: "object",
                    properties: {
                      TargetOriginId: {
                        type: "string",
                      },
                      TrustedSigners: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "boolean",
                          },
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["Enabled", "Quantity"],
                        additionalProperties: false,
                      },
                      TrustedKeyGroups: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "boolean",
                          },
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["Enabled", "Quantity"],
                        additionalProperties: false,
                      },
                      ViewerProtocolPolicy: {
                        type: "string",
                        enum: ["allow-all", "https-only", "redirect-to-https"],
                      },
                      AllowedMethods: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                          CachedMethods: {
                            type: "object",
                            properties: {
                              Quantity: {},
                              Items: {},
                            },
                            required: ["Quantity", "Items"],
                            additionalProperties: false,
                          },
                        },
                        required: ["Quantity", "Items"],
                        additionalProperties: false,
                      },
                      SmoothStreaming: {
                        type: "boolean",
                      },
                      Compress: {
                        type: "boolean",
                      },
                      LambdaFunctionAssociations: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                      FunctionAssociations: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                      FieldLevelEncryptionId: {
                        type: "string",
                      },
                      RealtimeLogConfigArn: {
                        type: "string",
                      },
                      CachePolicyId: {
                        type: "string",
                      },
                      OriginRequestPolicyId: {
                        type: "string",
                      },
                      ResponseHeadersPolicyId: {
                        type: "string",
                      },
                      GrpcConfig: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "boolean",
                          },
                        },
                        required: ["Enabled"],
                        additionalProperties: false,
                      },
                      ForwardedValues: {
                        type: "object",
                        properties: {
                          QueryString: {
                            type: "boolean",
                          },
                          Cookies: {
                            type: "object",
                            properties: {
                              Forward: {},
                              WhitelistedNames: {},
                            },
                            required: ["Forward"],
                            additionalProperties: false,
                          },
                          Headers: {
                            type: "object",
                            properties: {
                              Quantity: {},
                              Items: {},
                            },
                            required: ["Quantity"],
                            additionalProperties: false,
                          },
                          QueryStringCacheKeys: {
                            type: "object",
                            properties: {
                              Quantity: {},
                              Items: {},
                            },
                            required: ["Quantity"],
                            additionalProperties: false,
                          },
                        },
                        required: ["QueryString", "Cookies"],
                        additionalProperties: false,
                      },
                      MinTTL: {
                        type: "number",
                      },
                      DefaultTTL: {
                        type: "number",
                      },
                      MaxTTL: {
                        type: "number",
                      },
                    },
                    required: ["TargetOriginId", "ViewerProtocolPolicy"],
                    additionalProperties: false,
                  },
                  CacheBehaviors: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            PathPattern: {},
                            TargetOriginId: {},
                            TrustedSigners: {},
                            TrustedKeyGroups: {},
                            ViewerProtocolPolicy: {},
                            AllowedMethods: {},
                            SmoothStreaming: {},
                            Compress: {},
                            LambdaFunctionAssociations: {},
                            FunctionAssociations: {},
                            FieldLevelEncryptionId: {},
                            RealtimeLogConfigArn: {},
                            CachePolicyId: {},
                            OriginRequestPolicyId: {},
                            ResponseHeadersPolicyId: {},
                            GrpcConfig: {},
                            ForwardedValues: {},
                            MinTTL: {},
                            DefaultTTL: {},
                            MaxTTL: {},
                          },
                          required: [
                            "PathPattern",
                            "TargetOriginId",
                            "ViewerProtocolPolicy",
                          ],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                  CustomErrorResponses: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            ErrorCode: {},
                            ResponsePagePath: {},
                            ResponseCode: {},
                            ErrorCachingMinTTL: {},
                          },
                          required: ["ErrorCode"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                  Comment: {
                    type: "string",
                  },
                  Logging: {
                    type: "object",
                    properties: {
                      Enabled: {
                        type: "boolean",
                      },
                      IncludeCookies: {
                        type: "boolean",
                      },
                      Bucket: {
                        type: "string",
                      },
                      Prefix: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  PriceClass: {
                    type: "string",
                    enum: [
                      "PriceClass_100",
                      "PriceClass_200",
                      "PriceClass_All",
                      "None",
                    ],
                  },
                  Enabled: {
                    type: "boolean",
                  },
                  ViewerCertificate: {
                    type: "object",
                    properties: {
                      CloudFrontDefaultCertificate: {
                        type: "boolean",
                      },
                      IAMCertificateId: {
                        type: "string",
                      },
                      ACMCertificateArn: {
                        type: "string",
                      },
                      SSLSupportMethod: {
                        type: "string",
                        enum: ["sni-only", "vip", "static-ip"],
                      },
                      MinimumProtocolVersion: {
                        type: "string",
                        enum: [
                          "SSLv3",
                          "TLSv1",
                          "TLSv1_2016",
                          "TLSv1.1_2016",
                          "TLSv1.2_2018",
                          "TLSv1.2_2019",
                          "TLSv1.2_2021",
                          "TLSv1.3_2025",
                          "TLSv1.2_2025",
                        ],
                      },
                      Certificate: {
                        type: "string",
                      },
                      CertificateSource: {
                        type: "string",
                        enum: ["cloudfront", "iam", "acm"],
                      },
                    },
                    additionalProperties: false,
                  },
                  Restrictions: {
                    type: "object",
                    properties: {
                      GeoRestriction: {
                        type: "object",
                        properties: {
                          RestrictionType: {
                            type: "string",
                            enum: ["blacklist", "whitelist", "none"],
                          },
                          Quantity: {
                            type: "number",
                          },
                          Items: {
                            type: "array",
                            items: {},
                          },
                        },
                        required: ["RestrictionType", "Quantity"],
                        additionalProperties: false,
                      },
                    },
                    required: ["GeoRestriction"],
                    additionalProperties: false,
                  },
                  WebACLId: {
                    type: "string",
                  },
                  HttpVersion: {
                    type: "string",
                    enum: ["http1.1", "http2", "http3", "http2and3"],
                  },
                  IsIPV6Enabled: {
                    type: "boolean",
                  },
                  ContinuousDeploymentPolicyId: {
                    type: "string",
                  },
                  Staging: {
                    type: "boolean",
                  },
                  AnycastIpListId: {
                    type: "string",
                  },
                  TenantConfig: {
                    type: "object",
                    properties: {
                      ParameterDefinitions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            Name: {},
                            Definition: {},
                          },
                          required: ["Name", "Definition"],
                          additionalProperties: false,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  ConnectionMode: {
                    type: "string",
                    enum: ["direct", "tenant-only"],
                  },
                  ViewerMtlsConfig: {
                    type: "object",
                    properties: {
                      Mode: {
                        type: "string",
                        enum: ["required", "optional"],
                      },
                      TrustStoreConfig: {
                        type: "object",
                        properties: {
                          TrustStoreId: {
                            type: "string",
                          },
                          AdvertiseTrustStoreCaNames: {
                            type: "boolean",
                          },
                          IgnoreCertificateExpiry: {
                            type: "boolean",
                          },
                        },
                        required: ["TrustStoreId"],
                        additionalProperties: false,
                      },
                    },
                    additionalProperties: false,
                  },
                  ConnectionFunctionAssociation: {
                    type: "object",
                    properties: {
                      Id: {
                        type: "string",
                      },
                    },
                    required: ["Id"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "CallerReference",
                  "Origins",
                  "DefaultCacheBehavior",
                  "Comment",
                  "Enabled",
                ],
                additionalProperties: false,
              },
              AliasICPRecordals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    CNAME: {
                      type: "string",
                    },
                    ICPRecordalStatus: {
                      type: "string",
                      enum: ["APPROVED", "SUSPENDED", "PENDING"],
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            required: [
              "Id",
              "ARN",
              "Status",
              "LastModifiedTime",
              "InProgressInvalidationBatches",
              "DomainName",
              "DistributionConfig",
            ],
            additionalProperties: false,
            description:
              "A distribution tells CloudFront where you want content to be delivered from, and the details about how to track and manage content delivery.",
          },
          Location: {
            type: "string",
            description: "The URL of the staging distribution.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the staging distribution.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default copyDistribution;
