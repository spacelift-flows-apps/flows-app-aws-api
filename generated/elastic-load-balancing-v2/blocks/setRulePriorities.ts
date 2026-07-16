import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  SetRulePrioritiesCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const setRulePriorities: AppBlock = {
  name: "Set Rule Priorities",
  description: `Sets the priorities of the specified rules.`,
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
        RulePriorities: {
          name: "Rule Priorities",
          description: "The rule priorities.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RuleArn: {
                  type: "string",
                },
                Priority: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SetRulePrioritiesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Set Rule Priorities Result",
      description: "Result from SetRulePriorities operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RuleArn: {
                  type: "string",
                },
                Priority: {
                  type: "string",
                },
                Conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Field: {
                        type: "string",
                      },
                      Values: {
                        type: "array",
                        items: {},
                      },
                      HostHeaderConfig: {
                        type: "object",
                        properties: {
                          Values: {},
                          RegexValues: {},
                        },
                        additionalProperties: false,
                      },
                      PathPatternConfig: {
                        type: "object",
                        properties: {
                          Values: {},
                          RegexValues: {},
                        },
                        additionalProperties: false,
                      },
                      HttpHeaderConfig: {
                        type: "object",
                        properties: {
                          HttpHeaderName: {},
                          Values: {},
                          RegexValues: {},
                        },
                        additionalProperties: false,
                      },
                      QueryStringConfig: {
                        type: "object",
                        properties: {
                          Values: {},
                        },
                        additionalProperties: false,
                      },
                      HttpRequestMethodConfig: {
                        type: "object",
                        properties: {
                          Values: {},
                        },
                        additionalProperties: false,
                      },
                      SourceIpConfig: {
                        type: "object",
                        properties: {
                          Values: {},
                        },
                        additionalProperties: false,
                      },
                      RegexValues: {
                        type: "array",
                        items: {},
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Type: {
                        type: "string",
                      },
                      TargetGroupArn: {
                        type: "string",
                      },
                      AuthenticateOidcConfig: {
                        type: "object",
                        properties: {
                          Issuer: {},
                          AuthorizationEndpoint: {},
                          TokenEndpoint: {},
                          UserInfoEndpoint: {},
                          ClientId: {},
                          ClientSecret: {},
                          SessionCookieName: {},
                          Scope: {},
                          SessionTimeout: {},
                          AuthenticationRequestExtraParams: {},
                          OnUnauthenticatedRequest: {},
                          UseExistingClientSecret: {},
                        },
                        required: [
                          "Issuer",
                          "AuthorizationEndpoint",
                          "TokenEndpoint",
                          "UserInfoEndpoint",
                          "ClientId",
                        ],
                        additionalProperties: false,
                      },
                      AuthenticateCognitoConfig: {
                        type: "object",
                        properties: {
                          UserPoolArn: {},
                          UserPoolClientId: {},
                          UserPoolDomain: {},
                          SessionCookieName: {},
                          Scope: {},
                          SessionTimeout: {},
                          AuthenticationRequestExtraParams: {},
                          OnUnauthenticatedRequest: {},
                        },
                        required: [
                          "UserPoolArn",
                          "UserPoolClientId",
                          "UserPoolDomain",
                        ],
                        additionalProperties: false,
                      },
                      Order: {
                        type: "number",
                      },
                      RedirectConfig: {
                        type: "object",
                        properties: {
                          Protocol: {},
                          Port: {},
                          Host: {},
                          Path: {},
                          Query: {},
                          StatusCode: {},
                        },
                        required: ["StatusCode"],
                        additionalProperties: false,
                      },
                      FixedResponseConfig: {
                        type: "object",
                        properties: {
                          MessageBody: {},
                          StatusCode: {},
                          ContentType: {},
                        },
                        required: ["StatusCode"],
                        additionalProperties: false,
                      },
                      ForwardConfig: {
                        type: "object",
                        properties: {
                          TargetGroups: {},
                          TargetGroupStickinessConfig: {},
                        },
                        additionalProperties: false,
                      },
                      JwtValidationConfig: {
                        type: "object",
                        properties: {
                          JwksEndpoint: {},
                          Issuer: {},
                          AdditionalClaims: {},
                        },
                        required: ["JwksEndpoint", "Issuer"],
                        additionalProperties: false,
                      },
                    },
                    required: ["Type"],
                    additionalProperties: false,
                  },
                },
                IsDefault: {
                  type: "boolean",
                },
                Transforms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Type: {
                        type: "string",
                      },
                      HostHeaderRewriteConfig: {
                        type: "object",
                        properties: {
                          Rewrites: {},
                        },
                        additionalProperties: false,
                      },
                      UrlRewriteConfig: {
                        type: "object",
                        properties: {
                          Rewrites: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    required: ["Type"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "Information about the rules.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default setRulePriorities;
