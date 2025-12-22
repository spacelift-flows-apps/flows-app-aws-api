import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListDistributionTenantsByCustomizationCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDistributionTenantsByCustomization: AppBlock = {
  name: "List Distribution Tenants By Customization",
  description: `Lists distribution tenants by the customization that you specify.`,
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
        WebACLArn: {
          name: "Web ACL Arn",
          description: "Filter by the ARN of the associated WAF web ACL.",
          type: "string",
          required: false,
        },
        CertificateArn: {
          name: "Certificate Arn",
          description: "Filter by the ARN of the associated ACM certificate.",
          type: "string",
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of distribution tenants to return by the specified customization.",
          type: "number",
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

        const command = new ListDistributionTenantsByCustomizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Distribution Tenants By Customization Result",
      description:
        "Result from ListDistributionTenantsByCustomization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "A token used for pagination of results returned in the response.",
          },
          DistributionTenantList: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Domain"],
                    additionalProperties: false,
                  },
                },
                ConnectionGroupId: {
                  type: "string",
                },
                Customizations: {
                  type: "object",
                  properties: {
                    WebAcl: {
                      type: "object",
                      properties: {
                        Action: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Arn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Action"],
                      additionalProperties: false,
                    },
                    Certificate: {
                      type: "object",
                      properties: {
                        Arn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Arn"],
                      additionalProperties: false,
                    },
                    GeoRestrictions: {
                      type: "object",
                      properties: {
                        RestrictionType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Locations: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["RestrictionType"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                CreatedTime: {
                  type: "string",
                },
                LastModifiedTime: {
                  type: "string",
                },
                ETag: {
                  type: "string",
                },
                Enabled: {
                  type: "boolean",
                },
                Status: {
                  type: "string",
                },
              },
              required: [
                "Id",
                "DistributionId",
                "Name",
                "Arn",
                "Domains",
                "CreatedTime",
                "LastModifiedTime",
                "ETag",
              ],
              additionalProperties: false,
            },
            description:
              "A list of distribution tenants with the specified customization.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDistributionTenantsByCustomization;
