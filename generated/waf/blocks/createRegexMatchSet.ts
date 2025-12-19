import { AppBlock, events } from "@slflows/sdk/v1";
import { WAFClient, CreateRegexMatchSetCommand } from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRegexMatchSet: AppBlock = {
  name: "Create Regex Match Set",
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
          description: "A friendly name or description of the RegexMatchSet.",
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

        const command = new CreateRegexMatchSetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Regex Match Set Result",
      description: "Result from CreateRegexMatchSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RegexMatchSet: {
            type: "object",
            properties: {
              RegexMatchSetId: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              RegexMatchTuples: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    FieldToMatch: {
                      type: "object",
                      properties: {
                        Type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Data: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Type"],
                      additionalProperties: false,
                    },
                    TextTransformation: {
                      type: "string",
                    },
                    RegexPatternSetId: {
                      type: "string",
                    },
                  },
                  required: [
                    "FieldToMatch",
                    "TextTransformation",
                    "RegexPatternSetId",
                  ],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "A RegexMatchSet that contains no RegexMatchTuple objects.",
          },
          ChangeToken: {
            type: "string",
            description:
              "The ChangeToken that you used to submit the CreateRegexMatchSet request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRegexMatchSet;
