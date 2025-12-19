import { AppBlock, events } from "@slflows/sdk/v1";
import { WAFClient, UpdateRateBasedRuleCommand } from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateRateBasedRule: AppBlock = {
  name: "Update Rate Based Rule",
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
        RuleId: {
          name: "Rule Id",
          description:
            "The RuleId of the RateBasedRule that you want to update.",
          type: "string",
          required: true,
        },
        ChangeToken: {
          name: "Change Token",
          description:
            "The value returned by the most recent call to GetChangeToken.",
          type: "string",
          required: true,
        },
        Updates: {
          name: "Updates",
          description:
            "An array of RuleUpdate objects that you want to insert into or delete from a RateBasedRule.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Action: {
                  type: "string",
                },
                Predicate: {
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
              required: ["Action", "Predicate"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        RateLimit: {
          name: "Rate Limit",
          description:
            "The maximum number of requests, which have an identical value in the field specified by the RateKey, allowed in a five-minute period.",
          type: "number",
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

        const client = new WAFClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateRateBasedRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Rate Based Rule Result",
      description: "Result from UpdateRateBasedRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChangeToken: {
            type: "string",
            description:
              "The ChangeToken that you used to submit the UpdateRateBasedRule request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateRateBasedRule;
