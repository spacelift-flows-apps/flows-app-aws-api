import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  TestFunctionCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const testFunction: AppBlock = {
  name: "Test Function",
  description: `Tests a CloudFront function.`,
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
          description: "The name of the function that you are testing.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The current version (ETag value) of the function that you are testing, which you can get using DescribeFunction.",
          type: "string",
          required: true,
        },
        Stage: {
          name: "Stage",
          description:
            "The stage of the function that you are testing, either DEVELOPMENT or LIVE.",
          type: "string",
          required: false,
        },
        EventObject: {
          name: "Event Object",
          description: "The event object to test the function with.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new TestFunctionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Test Function Result",
      description: "Result from TestFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TestResult: {
            type: "object",
            properties: {
              FunctionSummary: {
                type: "object",
                properties: {
                  Name: {
                    type: "string",
                  },
                  Status: {
                    type: "string",
                  },
                  FunctionConfig: {
                    type: "object",
                    properties: {
                      Comment: {
                        type: "string",
                      },
                      Runtime: {
                        type: "string",
                      },
                      KeyValueStoreAssociations: {
                        type: "object",
                        properties: {
                          Quantity: {
                            type: "object",
                            additionalProperties: true,
                          },
                          Items: {
                            type: "object",
                            additionalProperties: true,
                          },
                        },
                        required: ["Quantity"],
                        additionalProperties: false,
                      },
                    },
                    required: ["Comment", "Runtime"],
                    additionalProperties: false,
                  },
                  FunctionMetadata: {
                    type: "object",
                    properties: {
                      FunctionARN: {
                        type: "string",
                      },
                      Stage: {
                        type: "string",
                      },
                      CreatedTime: {
                        type: "string",
                      },
                      LastModifiedTime: {
                        type: "string",
                      },
                    },
                    required: ["FunctionARN", "LastModifiedTime"],
                    additionalProperties: false,
                  },
                },
                required: ["Name", "FunctionConfig", "FunctionMetadata"],
                additionalProperties: false,
              },
              ComputeUtilization: {
                type: "string",
              },
              FunctionExecutionLogs: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              FunctionErrorMessage: {
                type: "string",
              },
              FunctionOutput: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "An object that represents the result of running the function with the provided event object.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default testFunction;
