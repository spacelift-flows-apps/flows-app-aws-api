import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateDistributionWithTagsCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDistributionWithTags: AppBlock = {
  name: "Create Distribution With Tags",
  description: `Create a new distribution with tags.`,
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
        DistributionConfigWithTags: {
          name: "Distribution Config With Tags",
          description: "The distribution's configuration information.",
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
                          type: "object",
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled", "Quantity"],
                        additionalProperties: false,
                      },
                      TrustedKeyGroups: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
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
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                          CachedMethods: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                      FunctionAssociations: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled"],
                        additionalProperties: false,
                      },
                      ForwardedValues: {
                        type: "object",
                        properties: {
                          QueryString: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Cookies: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Headers: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QueryStringCacheKeys: {
                            type: "object",
                            additionalProperties: true,
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
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                          RestrictionType: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
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
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  ConnectionMode: {
                    type: "string",
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
              Tags: {
                type: "object",
                properties: {
                  Items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Key"],
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["DistributionConfig", "Tags"],
            additionalProperties: false,
          },
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

        const command = new CreateDistributionWithTagsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Distribution With Tags Result",
      description: "Result from CreateDistributionWithTags operation",
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
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyPairIds: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyPairIds: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled", "Quantity"],
                        additionalProperties: false,
                      },
                      TrustedKeyGroups: {
                        type: "object",
                        properties: {
                          Enabled: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
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
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                          CachedMethods: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                      FunctionAssociations: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
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
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Enabled"],
                        additionalProperties: false,
                      },
                      ForwardedValues: {
                        type: "object",
                        properties: {
                          QueryString: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Cookies: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Headers: {
                            type: "object",
                            additionalProperties: true,
                          },
                          QueryStringCacheKeys: {
                            type: "object",
                            additionalProperties: true,
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
                          additionalProperties: true,
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
                          additionalProperties: true,
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
                          RestrictionType: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
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
                          additionalProperties: true,
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                  ConnectionMode: {
                    type: "string",
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
            description: "The distribution's information.",
          },
          Location: {
            type: "string",
            description:
              "The fully qualified URI of the new distribution resource just created.",
          },
          ETag: {
            type: "string",
            description: "The current version of the distribution created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDistributionWithTags;
