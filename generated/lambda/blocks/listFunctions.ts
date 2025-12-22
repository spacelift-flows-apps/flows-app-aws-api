import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listFunctions: AppBlock = {
  name: "List Functions",
  description: `Returns a list of Lambda functions, with the version-specific configuration of each.`,
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
        MasterRegion: {
          name: "Master Region",
          description:
            "For Lambda@Edge functions, the Amazon Web Services Region of the master function.",
          type: "string",
          required: false,
        },
        FunctionVersion: {
          name: "Function Version",
          description:
            "Set to ALL to include entries for all published versions of each function.",
          type: "string",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Specify the pagination token that's returned by a previous request to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of functions to return in the response.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListFunctionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Functions Result",
      description: "Result from ListFunctions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "The pagination token that's included if more results are available.",
          },
          Functions: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    SecurityGroupIds: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                      },
                    },
                    Error: {
                      type: "object",
                      properties: {
                        ErrorCode: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Message: {
                          type: "object",
                          additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      CodeSize: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SigningProfileVersionArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SigningJobArn: {
                        type: "object",
                        additionalProperties: true,
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
                        type: "object",
                        additionalProperties: true,
                      },
                      LocalMountPath: {
                        type: "object",
                        additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Command: {
                          type: "object",
                          additionalProperties: true,
                        },
                        WorkingDirectory: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Error: {
                      type: "object",
                      properties: {
                        ErrorCode: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Message: {
                          type: "object",
                          additionalProperties: true,
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
                          type: "object",
                          additionalProperties: true,
                        },
                        Message: {
                          type: "object",
                          additionalProperties: true,
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
            },
            description: "A list of Lambda functions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listFunctions;
