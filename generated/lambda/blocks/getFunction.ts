import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getFunction: AppBlock = {
  name: "Get Function",
  description: `Returns information about the function or function version, with a link to download the deployment package that's valid for 10 minutes.`,
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
        FunctionName: {
          name: "Function Name",
          description:
            "The name or ARN of the Lambda function, version, or alias.",
          type: "string",
          required: true,
        },
        Qualifier: {
          name: "Qualifier",
          description:
            "Specify a version or alias to get details about a published version of the function.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetFunctionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Function Result",
      description: "Result from GetFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Configuration: {
            type: "object",
            properties: {
              FunctionName: {
                type: "string",
              },
              FunctionArn: {
                type: "string",
              },
              Runtime: {
                type: "string",
              },
              Role: {
                type: "string",
              },
              Handler: {
                type: "string",
              },
              CodeSize: {
                type: "number",
              },
              Description: {
                type: "string",
              },
              Timeout: {
                type: "number",
              },
              MemorySize: {
                type: "number",
              },
              LastModified: {
                type: "string",
              },
              CodeSha256: {
                type: "string",
              },
              Version: {
                type: "string",
              },
              VpcConfig: {
                type: "object",
                properties: {
                  SubnetIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  SecurityGroupIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  VpcId: {
                    type: "string",
                  },
                  Ipv6AllowedForDualStack: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              DeadLetterConfig: {
                type: "object",
                properties: {
                  TargetArn: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Environment: {
                type: "object",
                properties: {
                  Variables: {
                    type: "object",
                    additionalProperties: {
                      type: "string",
                    },
                  },
                  Error: {
                    type: "object",
                    properties: {
                      ErrorCode: {
                        type: "string",
                      },
                      Message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              KMSKeyArn: {
                type: "string",
              },
              TracingConfig: {
                type: "object",
                properties: {
                  Mode: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              MasterArn: {
                type: "string",
              },
              RevisionId: {
                type: "string",
              },
              Layers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                    CodeSize: {
                      type: "number",
                    },
                    SigningProfileVersionArn: {
                      type: "string",
                    },
                    SigningJobArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              State: {
                type: "string",
              },
              StateReason: {
                type: "string",
              },
              StateReasonCode: {
                type: "string",
              },
              LastUpdateStatus: {
                type: "string",
              },
              LastUpdateStatusReason: {
                type: "string",
              },
              LastUpdateStatusReasonCode: {
                type: "string",
              },
              FileSystemConfigs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Arn: {
                      type: "string",
                    },
                    LocalMountPath: {
                      type: "string",
                    },
                  },
                  required: ["Arn", "LocalMountPath"],
                  additionalProperties: false,
                },
              },
              PackageType: {
                type: "string",
              },
              ImageConfigResponse: {
                type: "object",
                properties: {
                  ImageConfig: {
                    type: "object",
                    properties: {
                      EntryPoint: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      Command: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      WorkingDirectory: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                  Error: {
                    type: "object",
                    properties: {
                      ErrorCode: {
                        type: "string",
                      },
                      Message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              SigningProfileVersionArn: {
                type: "string",
              },
              SigningJobArn: {
                type: "string",
              },
              Architectures: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              EphemeralStorage: {
                type: "object",
                properties: {
                  Size: {
                    type: "number",
                  },
                },
                required: ["Size"],
                additionalProperties: false,
              },
              SnapStart: {
                type: "object",
                properties: {
                  ApplyOn: {
                    type: "string",
                  },
                  OptimizationStatus: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              RuntimeVersionConfig: {
                type: "object",
                properties: {
                  RuntimeVersionArn: {
                    type: "string",
                  },
                  Error: {
                    type: "object",
                    properties: {
                      ErrorCode: {
                        type: "string",
                      },
                      Message: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              LoggingConfig: {
                type: "object",
                properties: {
                  LogFormat: {
                    type: "string",
                  },
                  ApplicationLogLevel: {
                    type: "string",
                  },
                  SystemLogLevel: {
                    type: "string",
                  },
                  LogGroup: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The configuration of the function or version.",
          },
          Code: {
            type: "object",
            properties: {
              RepositoryType: {
                type: "string",
              },
              Location: {
                type: "string",
              },
              ImageUri: {
                type: "string",
              },
              ResolvedImageUri: {
                type: "string",
              },
              SourceKMSKeyArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The deployment package of the function or version.",
          },
          Tags: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description: "The function's tags.",
          },
          TagsError: {
            type: "object",
            properties: {
              ErrorCode: {
                type: "string",
              },
              Message: {
                type: "string",
              },
            },
            required: ["ErrorCode", "Message"],
            additionalProperties: false,
            description:
              "An object that contains details about an error related to retrieving tags.",
          },
          Concurrency: {
            type: "object",
            properties: {
              ReservedConcurrentExecutions: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "The function's reserved concurrency.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getFunction;
