import { AppBlock, events } from "@slflows/sdk/v1";
import { WAFClient, CreateRateBasedRuleCommand } from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRateBasedRule: AppBlock = {
  name: "Create Rate Based Rule",
  description: `This is AWS WAF Classic documentation.`,
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
        Name: {
          name: "Name",
          description: "A friendly name or description of the RateBasedRule.",
          type: "string",
          required: true,
        },
        MetricName: {
          name: "Metric Name",
          description:
            "A friendly name or description for the metrics for this RateBasedRule.",
          type: "string",
          required: true,
        },
        RateKey: {
          name: "Rate Key",
          description:
            "The field that AWS WAF uses to determine if requests are likely arriving from a single source and thus subject to rate monitoring.",
          type: "string",
          required: true,
        },
        RateLimit: {
          name: "Rate Limit",
          description:
            "The maximum number of requests, which have an identical value in the field that is specified by RateKey, allowed in a five-minute period.",
          type: "number",
          required: true,
        },
        ChangeToken: {
          name: "Change Token",
          description:
            "The ChangeToken that you used to submit the CreateRateBasedRule request.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "",
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
              required: ["Key", "Value"],
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

        const client = new WAFClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateRateBasedRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Rate Based Rule Result",
      description: "Result from CreateRateBasedRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Rule: {
            type: "object",
            properties: {
              RuleId: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              MetricName: {
                type: "string",
              },
              MatchPredicates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Negated: {
                      type: "boolean",
                    },
                    Type: {
                      type: "string",
                    },
                    DataId: {
                      type: "string",
                    },
                  },
                  required: ["Negated", "Type", "DataId"],
                  additionalProperties: false,
                },
              },
              RateKey: {
                type: "string",
              },
              RateLimit: {
                type: "number",
              },
            },
            required: ["RuleId", "MatchPredicates", "RateKey", "RateLimit"],
            additionalProperties: false,
            description:
              "The RateBasedRule that is returned in the CreateRateBasedRule response.",
          },
          ChangeToken: {
            type: "string",
            description:
              "The ChangeToken that you used to submit the CreateRateBasedRule request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRateBasedRule;
