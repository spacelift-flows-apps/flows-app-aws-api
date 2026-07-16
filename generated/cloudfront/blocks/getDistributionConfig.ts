import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetDistributionConfigCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDistributionConfig: AppBlock = {
  name: "Get Distribution Config",
  description: `Get the configuration information about a distribution.`,
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
        Id: {
          name: "Id",
          description: "The distribution's ID.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDistributionConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Distribution Config Result",
      description: "Result from GetDistributionConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
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
                        Id: {
                          type: "string",
                        },
                        DomainName: {
                          type: "string",
                        },
                        OriginPath: {
                          type: "string",
                        },
                        CustomHeaders: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Quantity"],
                          additionalProperties: false,
                        },
                        S3OriginConfig: {
                          type: "object",
                          properties: {
                            OriginAccessIdentity: {},
                            OriginReadTimeout: {},
                          },
                          required: ["OriginAccessIdentity"],
                          additionalProperties: false,
                        },
                        CustomOriginConfig: {
                          type: "object",
                          properties: {
                            HTTPPort: {},
                            HTTPSPort: {},
                            OriginProtocolPolicy: {},
                            OriginSslProtocols: {},
                            OriginReadTimeout: {},
                            OriginKeepaliveTimeout: {},
                            IpAddressType: {},
                            OriginMtlsConfig: {},
                          },
                          required: [
                            "HTTPPort",
                            "HTTPSPort",
                            "OriginProtocolPolicy",
                          ],
                          additionalProperties: false,
                        },
                        VpcOriginConfig: {
                          type: "object",
                          properties: {
                            VpcOriginId: {},
                            OwnerAccountId: {},
                            OriginReadTimeout: {},
                            OriginKeepaliveTimeout: {},
                          },
                          required: ["VpcOriginId"],
                          additionalProperties: false,
                        },
                        ConnectionAttempts: {
                          type: "number",
                        },
                        ConnectionTimeout: {
                          type: "number",
                        },
                        ResponseCompletionTimeout: {
                          type: "number",
                        },
                        OriginShield: {
                          type: "object",
                          properties: {
                            Enabled: {},
                            OriginShieldRegion: {},
                          },
                          required: ["Enabled"],
                          additionalProperties: false,
                        },
                        OriginAccessControlId: {
                          type: "string",
                        },
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
                        Id: {
                          type: "string",
                        },
                        FailoverCriteria: {
                          type: "object",
                          properties: {
                            StatusCodes: {},
                          },
                          required: ["StatusCodes"],
                          additionalProperties: false,
                        },
                        Members: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Quantity", "Items"],
                          additionalProperties: false,
                        },
                        SelectionCriteria: {
                          type: "string",
                          enum: ["default", "media-quality-based"],
                        },
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
                        items: {
                          type: "string",
                        },
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
                        items: {
                          type: "string",
                        },
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
                        items: {
                          type: "string",
                          enum: [
                            "GET",
                            "HEAD",
                            "POST",
                            "PUT",
                            "PATCH",
                            "OPTIONS",
                            "DELETE",
                          ],
                        },
                      },
                      CachedMethods: {
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
                        items: {
                          type: "object",
                          properties: {
                            LambdaFunctionARN: {},
                            EventType: {},
                            IncludeBody: {},
                          },
                          required: ["LambdaFunctionARN", "EventType"],
                          additionalProperties: false,
                        },
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
                        items: {
                          type: "object",
                          properties: {
                            FunctionARN: {},
                            EventType: {},
                          },
                          required: ["FunctionARN", "EventType"],
                          additionalProperties: false,
                        },
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
                          Forward: {
                            type: "string",
                            enum: ["none", "whitelist", "all"],
                          },
                          WhitelistedNames: {
                            type: "object",
                            properties: {
                              Quantity: {},
                              Items: {},
                            },
                            required: ["Quantity"],
                            additionalProperties: false,
                          },
                        },
                        required: ["Forward"],
                        additionalProperties: false,
                      },
                      Headers: {
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
                      QueryStringCacheKeys: {
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
                        PathPattern: {
                          type: "string",
                        },
                        TargetOriginId: {
                          type: "string",
                        },
                        TrustedSigners: {
                          type: "object",
                          properties: {
                            Enabled: {},
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Enabled", "Quantity"],
                          additionalProperties: false,
                        },
                        TrustedKeyGroups: {
                          type: "object",
                          properties: {
                            Enabled: {},
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Enabled", "Quantity"],
                          additionalProperties: false,
                        },
                        ViewerProtocolPolicy: {
                          type: "string",
                          enum: [
                            "allow-all",
                            "https-only",
                            "redirect-to-https",
                          ],
                        },
                        AllowedMethods: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
                            CachedMethods: {},
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
                            Quantity: {},
                            Items: {},
                          },
                          required: ["Quantity"],
                          additionalProperties: false,
                        },
                        FunctionAssociations: {
                          type: "object",
                          properties: {
                            Quantity: {},
                            Items: {},
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
                            Enabled: {},
                          },
                          required: ["Enabled"],
                          additionalProperties: false,
                        },
                        ForwardedValues: {
                          type: "object",
                          properties: {
                            QueryString: {},
                            Cookies: {},
                            Headers: {},
                            QueryStringCacheKeys: {},
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
                        ErrorCode: {
                          type: "number",
                        },
                        ResponsePagePath: {
                          type: "string",
                        },
                        ResponseCode: {
                          type: "string",
                        },
                        ErrorCachingMinTTL: {
                          type: "number",
                        },
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
                        items: {
                          type: "string",
                        },
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
                        Name: {
                          type: "string",
                        },
                        Definition: {
                          type: "object",
                          properties: {
                            StringSchema: {},
                          },
                          additionalProperties: false,
                        },
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
            description: "The distribution's configuration information.",
          },
          ETag: {
            type: "string",
            description: "The current version of the configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDistributionConfig;
