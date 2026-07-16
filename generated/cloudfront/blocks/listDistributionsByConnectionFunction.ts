import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListDistributionsByConnectionFunctionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDistributionsByConnectionFunction: AppBlock = {
  name: "List Distributions By Connection Function",
  description: `Lists distributions by connection function.`,
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
        Marker: {
          name: "Marker",
          description:
            "Use this field when paginating results to indicate where to begin in your list.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of distributions that you want returned in the response.",
          type: "number",
          required: false,
        },
        ConnectionFunctionIdentifier: {
          name: "Connection Function Identifier",
          description: "The distributions by connection function identifier.",
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

        const command = new ListDistributionsByConnectionFunctionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Distributions By Connection Function Result",
      description:
        "Result from ListDistributionsByConnectionFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DistributionList: {
            type: "object",
            properties: {
              Marker: {
                type: "string",
              },
              NextMarker: {
                type: "string",
              },
              MaxItems: {
                type: "number",
              },
              IsTruncated: {
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
                    Id: {
                      type: "string",
                    },
                    ARN: {
                      type: "string",
                    },
                    ETag: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    LastModifiedTime: {
                      type: "string",
                    },
                    DomainName: {
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
                          items: {},
                        },
                      },
                      required: ["Quantity"],
                      additionalProperties: false,
                    },
                    Origins: {
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
                    OriginGroups: {
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
                    DefaultCacheBehavior: {
                      type: "object",
                      properties: {
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
                          items: {},
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
                          items: {},
                        },
                      },
                      required: ["Quantity"],
                      additionalProperties: false,
                    },
                    Comment: {
                      type: "string",
                    },
                    PriceClass: {
                      type: "string",
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
                        },
                        MinimumProtocolVersion: {
                          type: "string",
                        },
                        Certificate: {
                          type: "string",
                        },
                        CertificateSource: {
                          type: "string",
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
                            RestrictionType: {},
                            Quantity: {},
                            Items: {},
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
                    },
                    IsIPV6Enabled: {
                      type: "boolean",
                    },
                    AliasICPRecordals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          CNAME: {},
                          ICPRecordalStatus: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Staging: {
                      type: "boolean",
                    },
                    ConnectionMode: {
                      type: "string",
                    },
                    AnycastIpListId: {
                      type: "string",
                    },
                    ViewerMtlsConfig: {
                      type: "object",
                      properties: {
                        Mode: {
                          type: "string",
                        },
                        TrustStoreConfig: {
                          type: "object",
                          properties: {
                            TrustStoreId: {},
                            AdvertiseTrustStoreCaNames: {},
                            IgnoreCertificateExpiry: {},
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
                    "Id",
                    "ARN",
                    "Status",
                    "LastModifiedTime",
                    "DomainName",
                    "Aliases",
                    "Origins",
                    "DefaultCacheBehavior",
                    "CacheBehaviors",
                    "CustomErrorResponses",
                    "Comment",
                    "PriceClass",
                    "Enabled",
                    "ViewerCertificate",
                    "Restrictions",
                    "WebACLId",
                    "HttpVersion",
                    "IsIPV6Enabled",
                    "Staging",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["Marker", "MaxItems", "IsTruncated", "Quantity"],
            additionalProperties: false,
            description: "A distribution list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDistributionsByConnectionFunction;
