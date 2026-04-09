import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  ListAsyncInvokesCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAsyncInvokes: AppBlock = {
  name: "List Async Invokes",
  description: `Lists asynchronous invocations.`,
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
        submitTimeAfter: {
          name: "submit Time After",
          description: "Include invocations submitted after this time.",
          type: "string",
          required: false,
        },
        submitTimeBefore: {
          name: "submit Time Before",
          description: "Include invocations submitted before this time.",
          type: "string",
          required: false,
        },
        statusEquals: {
          name: "status Equals",
          description: "Filter invocations by status.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of invocations to return in one page of results.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "Specify the pagination token from a previous request to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        sortBy: {
          name: "sort By",
          description: "How to sort the response.",
          type: "string",
          required: false,
        },
        sortOrder: {
          name: "sort Order",
          description: "The sorting order for the response.",
          type: "string",
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

        const client = new BedrockRuntimeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListAsyncInvokesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Async Invokes Result",
      description: "Result from ListAsyncInvokes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nextToken: {
            type: "string",
            description:
              "Specify the pagination token from a previous request to retrieve the next page of results.",
          },
          asyncInvokeSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                invocationArn: {
                  type: "string",
                },
                modelArn: {
                  type: "string",
                },
                clientRequestToken: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                failureMessage: {
                  type: "string",
                },
                submitTime: {
                  type: "string",
                },
                lastModifiedTime: {
                  type: "string",
                },
                endTime: {
                  type: "string",
                },
                outputDataConfig: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        s3OutputDataConfig: {
                          type: "object",
                          properties: {
                            s3Uri: {
                              type: "object",
                              additionalProperties: true,
                            },
                            kmsKeyId: {
                              type: "object",
                              additionalProperties: true,
                            },
                            bucketOwner: {
                              type: "object",
                              additionalProperties: true,
                            },
                          },
                          required: ["s3Uri"],
                          additionalProperties: false,
                        },
                      },
                      required: ["s3OutputDataConfig"],
                      additionalProperties: false,
                    },
                  ],
                },
              },
              required: [
                "invocationArn",
                "modelArn",
                "submitTime",
                "outputDataConfig",
              ],
              additionalProperties: false,
            },
            description: "A list of invocation summaries.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listAsyncInvokes;
