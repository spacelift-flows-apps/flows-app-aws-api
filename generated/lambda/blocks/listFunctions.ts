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
          type: {
            type: "string",
            enum: ["ALL"],
          },
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
                  enum: [
                    "nodejs",
                    "nodejs4.3",
                    "nodejs6.10",
                    "nodejs8.10",
                    "nodejs10.x",
                    "nodejs12.x",
                    "nodejs14.x",
                    "nodejs16.x",
                    "java8",
                    "java8.al2",
                    "java11",
                    "python2.7",
                    "python3.6",
                    "python3.7",
                    "python3.8",
                    "python3.9",
                    "dotnetcore1.0",
                    "dotnetcore2.0",
                    "dotnetcore2.1",
                    "dotnetcore3.1",
                    "dotnet6",
                    "dotnet8",
                    "nodejs4.3-edge",
                    "go1.x",
                    "ruby2.5",
                    "ruby2.7",
                    "provided",
                    "provided.al2",
                    "nodejs18.x",
                    "python3.10",
                    "java17",
                    "ruby3.2",
                    "ruby3.3",
                    "ruby3.4",
                    "python3.11",
                    "nodejs20.x",
                    "provided.al2023",
                    "python3.12",
                    "java21",
                    "python3.13",
                    "nodejs22.x",
                    "nodejs24.x",
                    "python3.14",
                    "java25",
                    "dotnet10",
                    "ruby4.0",
                  ],
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
                      enum: ["Active", "PassThrough"],
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
                  enum: [
                    "Pending",
                    "Active",
                    "Inactive",
                    "Failed",
                    "Deactivating",
                    "Deactivated",
                    "ActiveNonInvocable",
                    "Deleting",
                  ],
                },
                StateReason: {
                  type: "string",
                },
                StateReasonCode: {
                  type: "string",
                  enum: [
                    "Idle",
                    "Creating",
                    "Restoring",
                    "EniLimitExceeded",
                    "InsufficientRolePermissions",
                    "InvalidConfiguration",
                    "InternalError",
                    "SubnetOutOfIPAddresses",
                    "InvalidSubnet",
                    "InvalidSecurityGroup",
                    "ImageDeleted",
                    "ImageAccessDenied",
                    "InvalidImage",
                    "KMSKeyAccessDenied",
                    "KMSKeyNotFound",
                    "InvalidStateKMSKey",
                    "DisabledKMSKey",
                    "EFSIOError",
                    "EFSMountConnectivityError",
                    "EFSMountFailure",
                    "EFSMountTimeout",
                    "InvalidRuntime",
                    "InvalidZipFileException",
                    "FunctionError",
                    "DrainingDurableExecutions",
                    "VcpuLimitExceeded",
                    "CapacityProviderScalingLimitExceeded",
                    "InsufficientCapacity",
                    "EC2RequestLimitExceeded",
                    "FunctionError.InitTimeout",
                    "FunctionError.RuntimeInitError",
                    "FunctionError.ExtensionInitError",
                    "FunctionError.InvalidEntryPoint",
                    "FunctionError.InvalidWorkingDirectory",
                    "FunctionError.PermissionDenied",
                    "FunctionError.TooManyExtensions",
                    "FunctionError.InitResourceExhausted",
                    "DisallowedByVpcEncryptionControl",
                  ],
                },
                LastUpdateStatus: {
                  type: "string",
                  enum: ["Successful", "Failed", "InProgress"],
                },
                LastUpdateStatusReason: {
                  type: "string",
                },
                LastUpdateStatusReasonCode: {
                  type: "string",
                  enum: [
                    "EniLimitExceeded",
                    "InsufficientRolePermissions",
                    "InvalidConfiguration",
                    "InternalError",
                    "SubnetOutOfIPAddresses",
                    "InvalidSubnet",
                    "InvalidSecurityGroup",
                    "ImageDeleted",
                    "ImageAccessDenied",
                    "InvalidImage",
                    "KMSKeyAccessDenied",
                    "KMSKeyNotFound",
                    "InvalidStateKMSKey",
                    "DisabledKMSKey",
                    "EFSIOError",
                    "EFSMountConnectivityError",
                    "EFSMountFailure",
                    "EFSMountTimeout",
                    "InvalidRuntime",
                    "InvalidZipFileException",
                    "FunctionError",
                    "VcpuLimitExceeded",
                    "CapacityProviderScalingLimitExceeded",
                    "InsufficientCapacity",
                    "EC2RequestLimitExceeded",
                    "FunctionError.InitTimeout",
                    "FunctionError.RuntimeInitError",
                    "FunctionError.ExtensionInitError",
                    "FunctionError.InvalidEntryPoint",
                    "FunctionError.InvalidWorkingDirectory",
                    "FunctionError.PermissionDenied",
                    "FunctionError.TooManyExtensions",
                    "FunctionError.InitResourceExhausted",
                    "DisallowedByVpcEncryptionControl",
                  ],
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
                  enum: ["Zip", "Image"],
                },
                ImageConfigResponse: {
                  type: "object",
                  properties: {
                    ImageConfig: {
                      type: "object",
                      properties: {
                        EntryPoint: {
                          type: "array",
                          items: {},
                        },
                        Command: {
                          type: "array",
                          items: {},
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
                    enum: ["x86_64", "arm64"],
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
                      enum: ["PublishedVersions", "None"],
                    },
                    OptimizationStatus: {
                      type: "string",
                      enum: ["On", "Off"],
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
                      enum: ["JSON", "Text"],
                    },
                    ApplicationLogLevel: {
                      type: "string",
                      enum: [
                        "TRACE",
                        "DEBUG",
                        "INFO",
                        "WARN",
                        "ERROR",
                        "FATAL",
                      ],
                    },
                    SystemLogLevel: {
                      type: "string",
                      enum: ["DEBUG", "INFO", "WARN"],
                    },
                    LogGroup: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                CapacityProviderConfig: {
                  type: "object",
                  properties: {
                    LambdaManagedInstancesCapacityProviderConfig: {
                      type: "object",
                      properties: {
                        CapacityProviderArn: {
                          type: "string",
                        },
                        PerExecutionEnvironmentMaxConcurrency: {
                          type: "number",
                        },
                        ExecutionEnvironmentMemoryGiBPerVCpu: {
                          type: "number",
                        },
                      },
                      required: ["CapacityProviderArn"],
                      additionalProperties: false,
                    },
                  },
                  required: ["LambdaManagedInstancesCapacityProviderConfig"],
                  additionalProperties: false,
                },
                ConfigSha256: {
                  type: "string",
                },
                DurableConfig: {
                  type: "object",
                  properties: {
                    RetentionPeriodInDays: {
                      type: "number",
                    },
                    ExecutionTimeout: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                TenancyConfig: {
                  type: "object",
                  properties: {
                    TenantIsolationMode: {
                      type: "string",
                      enum: ["PER_TENANT"],
                    },
                  },
                  required: ["TenantIsolationMode"],
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
