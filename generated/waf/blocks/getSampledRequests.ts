import { AppBlock, events } from "@slflows/sdk/v1";
import { WAFClient, GetSampledRequestsCommand } from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getSampledRequests: AppBlock = {
  name: "Get Sampled Requests",
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
        WebAclId: {
          name: "Web Acl Id",
          description:
            "The WebACLId of the WebACL for which you want GetSampledRequests to return a sample of requests.",
          type: "string",
          required: true,
        },
        RuleId: {
          name: "Rule Id",
          description:
            "RuleId is one of three values: The RuleId of the Rule or the RuleGroupId of the RuleGroup for which you want GetSampledRequests to return a sample of requests.",
          type: "string",
          required: true,
        },
        TimeWindow: {
          name: "Time Window",
          description:
            "The start date and time and the end date and time of the range for which you want GetSampledRequests to return a sample of requests.",
          type: {
            type: "object",
            properties: {
              StartTime: {
                type: "string",
              },
              EndTime: {
                type: "string",
              },
            },
            required: ["StartTime", "EndTime"],
            additionalProperties: false,
          },
          required: true,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The number of requests that you want AWS WAF to return from among the first 5,000 requests that your AWS resource received during the time range.",
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

        const command = new GetSampledRequestsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Sampled Requests Result",
      description: "Result from GetSampledRequests operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SampledRequests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Request: {
                  type: "object",
                  properties: {
                    ClientIP: {
                      type: "string",
                    },
                    Country: {
                      type: "string",
                    },
                    URI: {
                      type: "string",
                    },
                    Method: {
                      type: "string",
                    },
                    HTTPVersion: {
                      type: "string",
                    },
                    Headers: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                Weight: {
                  type: "number",
                },
                Timestamp: {
                  type: "string",
                },
                Action: {
                  type: "string",
                },
                RuleWithinRuleGroup: {
                  type: "string",
                },
              },
              required: ["Request", "Weight"],
              additionalProperties: false,
            },
            description:
              "A complex type that contains detailed information about each of the requests in the sample.",
          },
          PopulationSize: {
            type: "number",
            description:
              "The total number of requests from which GetSampledRequests got a sample of MaxItems requests.",
          },
          TimeWindow: {
            type: "object",
            properties: {
              StartTime: {
                type: "string",
              },
              EndTime: {
                type: "string",
              },
            },
            required: ["StartTime", "EndTime"],
            additionalProperties: false,
            description:
              "Usually, TimeWindow is the time range that you specified in the GetSampledRequests request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getSampledRequests;
