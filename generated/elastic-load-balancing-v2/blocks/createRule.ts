import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  CreateRuleCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRule: AppBlock = {
  name: "Create Rule",
  description: `Creates a rule for the specified listener.`,
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
        ListenerArn: {
          name: "Listener Arn",
          description: "The Amazon Resource Name (ARN) of the listener.",
          type: "string",
          required: true,
        },
        Conditions: {
          name: "Conditions",
          description: "The conditions.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Field: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                HostHeaderConfig: {
                  type: "object",
                  properties: {
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    RegexValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                PathPatternConfig: {
                  type: "object",
                  properties: {
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    RegexValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                HttpHeaderConfig: {
                  type: "object",
                  properties: {
                    HttpHeaderName: {
                      type: "string",
                    },
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    RegexValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                QueryStringConfig: {
                  type: "object",
                  properties: {
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                HttpRequestMethodConfig: {
                  type: "object",
                  properties: {
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                SourceIpConfig: {
                  type: "object",
                  properties: {
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                RegexValues: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: true,
        },
        Priority: {
          name: "Priority",
          description: "The rule priority.",
          type: "number",
          required: true,
        },
        Actions: {
          name: "Actions",
          description: "The actions.",
          type: {
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
                    Issuer: {
                      type: "string",
                    },
                    AuthorizationEndpoint: {
                      type: "string",
                    },
                    TokenEndpoint: {
                      type: "string",
                    },
                    UserInfoEndpoint: {
                      type: "string",
                    },
                    ClientId: {
                      type: "string",
                    },
                    ClientSecret: {
                      type: "string",
                    },
                    SessionCookieName: {
                      type: "string",
                    },
                    Scope: {
                      type: "string",
                    },
                    SessionTimeout: {
                      type: "number",
                    },
                    AuthenticationRequestExtraParams: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    OnUnauthenticatedRequest: {
                      type: "string",
                    },
                    UseExistingClientSecret: {
                      type: "boolean",
                    },
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
                    UserPoolArn: {
                      type: "string",
                    },
                    UserPoolClientId: {
                      type: "string",
                    },
                    UserPoolDomain: {
                      type: "string",
                    },
                    SessionCookieName: {
                      type: "string",
                    },
                    Scope: {
                      type: "string",
                    },
                    SessionTimeout: {
                      type: "number",
                    },
                    AuthenticationRequestExtraParams: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    OnUnauthenticatedRequest: {
                      type: "string",
                    },
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
                    Protocol: {
                      type: "string",
                    },
                    Port: {
                      type: "string",
                    },
                    Host: {
                      type: "string",
                    },
                    Path: {
                      type: "string",
                    },
                    Query: {
                      type: "string",
                    },
                    StatusCode: {
                      type: "string",
                    },
                  },
                  required: ["StatusCode"],
                  additionalProperties: false,
                },
                FixedResponseConfig: {
                  type: "object",
                  properties: {
                    MessageBody: {
                      type: "string",
                    },
                    StatusCode: {
                      type: "string",
                    },
                    ContentType: {
                      type: "string",
                    },
                  },
                  required: ["StatusCode"],
                  additionalProperties: false,
                },
                ForwardConfig: {
                  type: "object",
                  properties: {
                    TargetGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetGroupStickinessConfig: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DurationSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                JwtValidationConfig: {
                  type: "object",
                  properties: {
                    JwksEndpoint: {
                      type: "string",
                    },
                    Issuer: {
                      type: "string",
                    },
                    AdditionalClaims: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["JwksEndpoint", "Issuer"],
                  additionalProperties: false,
                },
              },
              required: ["Type"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the rule.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Transforms: {
          name: "Transforms",
          description:
            "The transforms to apply to requests that match this rule.",
          type: {
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
                    Rewrites: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                UrlRewriteConfig: {
                  type: "object",
                  properties: {
                    Rewrites: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Type"],
              additionalProperties: false,
            },
          },
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Rule Result",
      description: "Result from CreateRule operation",
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
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                      HostHeaderConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PathPatternConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      HttpHeaderConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      QueryStringConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      HttpRequestMethodConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SourceIpConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RegexValues: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetGroupArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthenticateOidcConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthenticateCognitoConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Order: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RedirectConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FixedResponseConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ForwardConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      JwtValidationConfig: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      HostHeaderRewriteConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      UrlRewriteConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Type"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "Information about the rule.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRule;
