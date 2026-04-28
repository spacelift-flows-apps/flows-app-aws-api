import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  DescribeRulesCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRules: AppBlock = {
  name: "Describe Rules",
  description: `Describes the specified rules or the rules for the specified listener.`,
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
          required: false,
        },
        RuleArns: {
          name: "Rule Arns",
          description: "The Amazon Resource Names (ARN) of the rules.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        PageSize: {
          name: "Page Size",
          description:
            "The maximum number of results to return with this call.",
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeRulesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Rules Result",
      description: "Result from DescribeRules operation",
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
            description: "Information about the rules.",
          },
          NextMarker: {
            type: "string",
            description:
              "If there are additional results, this is the marker for the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeRules;
