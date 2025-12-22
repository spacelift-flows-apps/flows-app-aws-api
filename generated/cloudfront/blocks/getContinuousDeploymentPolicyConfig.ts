import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetContinuousDeploymentPolicyConfigCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getContinuousDeploymentPolicyConfig: AppBlock = {
  name: "Get Continuous Deployment Policy Config",
  description: `Gets configuration information about a continuous deployment policy.`,
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
          description:
            "The identifier of the continuous deployment policy whose configuration you are getting.",
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

        const command = new GetContinuousDeploymentPolicyConfigCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Continuous Deployment Policy Config Result",
      description: "Result from GetContinuousDeploymentPolicyConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ContinuousDeploymentPolicyConfig: {
            type: "object",
            properties: {
              StagingDistributionDnsNames: {
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
              Enabled: {
                type: "boolean",
              },
              TrafficConfig: {
                type: "object",
                properties: {
                  SingleWeightConfig: {
                    type: "object",
                    properties: {
                      Weight: {
                        type: "number",
                      },
                      SessionStickinessConfig: {
                        type: "object",
                        properties: {
                          IdleTTL: {
                            type: "object",
                            additionalProperties: true,
                          },
                          MaximumTTL: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["IdleTTL", "MaximumTTL"],
                        additionalProperties: false,
                      },
                    },
                    required: ["Weight"],
                    additionalProperties: false,
                  },
                  SingleHeaderConfig: {
                    type: "object",
                    properties: {
                      Header: {
                        type: "string",
                      },
                      Value: {
                        type: "string",
                      },
                    },
                    required: ["Header", "Value"],
                    additionalProperties: false,
                  },
                  Type: {
                    type: "string",
                  },
                },
                required: ["Type"],
                additionalProperties: false,
              },
            },
            required: ["StagingDistributionDnsNames", "Enabled"],
            additionalProperties: false,
            description:
              "Contains the configuration for a continuous deployment policy.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the continuous deployment policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getContinuousDeploymentPolicyConfig;
