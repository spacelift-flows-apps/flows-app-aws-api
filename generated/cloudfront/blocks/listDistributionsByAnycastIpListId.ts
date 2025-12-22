import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListDistributionsByAnycastIpListIdCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDistributionsByAnycastIpListId: AppBlock = {
  name: "List Distributions By Anycast Ip List Id",
  description: `Lists the distributions in your account that are associated with the specified AnycastIpListId.`,
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
        AnycastIpListId: {
          name: "Anycast Ip List Id",
          description: "The ID of the Anycast static IP list.",
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
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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

        const command = new ListDistributionsByAnycastIpListIdCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Distributions By Anycast Ip List Id Result",
      description: "Result from ListDistributionsByAnycastIpListId operation",
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
                    Origins: {
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
                      required: ["Quantity", "Items"],
                      additionalProperties: false,
                    },
                    OriginGroups: {
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
                    DefaultCacheBehavior: {
                      type: "object",
                      properties: {
                        TargetOriginId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TrustedSigners: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TrustedKeyGroups: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ViewerProtocolPolicy: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AllowedMethods: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SmoothStreaming: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Compress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LambdaFunctionAssociations: {
                          type: "object",
                          additionalProperties: true,
                        },
                        FunctionAssociations: {
                          type: "object",
                          additionalProperties: true,
                        },
                        FieldLevelEncryptionId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        RealtimeLogConfigArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CachePolicyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OriginRequestPolicyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResponseHeadersPolicyId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GrpcConfig: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ForwardedValues: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MinTTL: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DefaultTTL: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MaxTTL: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["TargetOriginId", "ViewerProtocolPolicy"],
                      additionalProperties: false,
                    },
                    CacheBehaviors: {
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
                    CustomErrorResponses: {
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
                          type: "object",
                          additionalProperties: true,
                        },
                        IAMCertificateId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ACMCertificateArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SSLSupportMethod: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MinimumProtocolVersion: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Certificate: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CertificateSource: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Restrictions: {
                      type: "object",
                      properties: {
                        GeoRestriction: {
                          type: "object",
                          additionalProperties: true,
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
                        additionalProperties: true,
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

export default listDistributionsByAnycastIpListId;
