import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetDistributionTenantCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDistributionTenant: AppBlock = {
  name: "Get Distribution Tenant",
  description: `Gets information about a distribution tenant.`,
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
        Identifier: {
          name: "Identifier",
          description: "The identifier of the distribution tenant.",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDistributionTenantCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Distribution Tenant Result",
      description: "Result from GetDistributionTenant operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DistributionTenant: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              DistributionId: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              Domains: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Domain: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  required: ["Domain"],
                  additionalProperties: false,
                },
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
              Customizations: {
                type: "object",
                properties: {
                  WebAcl: {
                    type: "object",
                    properties: {
                      Action: {
                        type: "string",
                      },
                      Arn: {
                        type: "string",
                      },
                    },
                    required: ["Action"],
                    additionalProperties: false,
                  },
                  Certificate: {
                    type: "object",
                    properties: {
                      Arn: {
                        type: "string",
                      },
                    },
                    required: ["Arn"],
                    additionalProperties: false,
                  },
                  GeoRestrictions: {
                    type: "object",
                    properties: {
                      RestrictionType: {
                        type: "string",
                      },
                      Locations: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["RestrictionType"],
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              Parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Name", "Value"],
                  additionalProperties: false,
                },
              },
              ConnectionGroupId: {
                type: "string",
              },
              CreatedTime: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              Enabled: {
                type: "boolean",
              },
              Status: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The distribution tenant that you retrieved.",
          },
          ETag: {
            type: "string",
            description: "The current version of the distribution tenant.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDistributionTenant;
