import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, CreateFunctionCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createFunction: AppBlock = {
  name: "Create Function",
  description: `Creates a Lambda function.`,
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
          description: "The name or ARN of the Lambda function.",
          type: "string",
          required: true,
        },
        Runtime: {
          name: "Runtime",
          description: "The identifier of the function's runtime.",
          type: {
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
          required: false,
        },
        Role: {
          name: "Role",
          description:
            "The Amazon Resource Name (ARN) of the function's execution role.",
          type: "string",
          required: true,
        },
        Handler: {
          name: "Handler",
          description:
            "The name of the method within your code that Lambda calls to run your function.",
          type: "string",
          required: false,
        },
        Code: {
          name: "Code",
          description: "The code for the function.",
          type: {
            type: "object",
            properties: {
              ZipFile: {
                type: "string",
              },
              S3Bucket: {
                type: "string",
              },
              S3Key: {
                type: "string",
              },
              S3ObjectVersion: {
                type: "string",
              },
              ImageUri: {
                type: "string",
              },
              SourceKMSKeyArn: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description of the function.",
          type: "string",
          required: false,
        },
        Timeout: {
          name: "Timeout",
          description:
            "The amount of time (in seconds) that Lambda allows a function to run before stopping it.",
          type: "number",
          required: false,
        },
        MemorySize: {
          name: "Memory Size",
          description:
            "The amount of memory available to the function at runtime.",
          type: "number",
          required: false,
        },
        Publish: {
          name: "Publish",
          description:
            "Set to true to publish the first version of the function during creation.",
          type: "boolean",
          required: false,
        },
        VpcConfig: {
          name: "Vpc Config",
          description:
            "For network connectivity to Amazon Web Services resources in a VPC, specify a list of security groups and subnets in the VPC.",
          type: {
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
              Ipv6AllowedForDualStack: {
                type: "boolean",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        PackageType: {
          name: "Package Type",
          description: "The type of deployment package.",
          type: {
            type: "string",
            enum: ["Zip", "Image"],
          },
          required: false,
        },
        DeadLetterConfig: {
          name: "Dead Letter Config",
          description:
            "A dead-letter queue configuration that specifies the queue or topic where Lambda sends asynchronous events when they fail processing.",
          type: {
            type: "object",
            properties: {
              TargetArn: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Environment: {
          name: "Environment",
          description:
            "Environment variables that are accessible from function code during execution.",
          type: {
            type: "object",
            properties: {
              Variables: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        KMSKeyArn: {
          name: "KMS Key Arn",
          description:
            "The ARN of the Key Management Service (KMS) customer managed key that's used to encrypt the following resources: The function's environment variables.",
          type: "string",
          required: false,
        },
        TracingConfig: {
          name: "Tracing Config",
          description:
            "Set Mode to Active to sample and trace a subset of incoming requests with X-Ray.",
          type: {
            type: "object",
            properties: {
              Mode: {
                type: "string",
                enum: ["Active", "PassThrough"],
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags to apply to the function.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        Layers: {
          name: "Layers",
          description:
            "A list of function layers to add to the function's execution environment.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        FileSystemConfigs: {
          name: "File System Configs",
          description:
            "Connection settings for an Amazon EFS file system or an Amazon S3 Files file system.",
          type: {
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
          required: false,
        },
        ImageConfig: {
          name: "Image Config",
          description:
            "Container image configuration values that override the values in the container image Dockerfile.",
          type: {
            type: "object",
            properties: {
              EntryPoint: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Command: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              WorkingDirectory: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CodeSigningConfigArn: {
          name: "Code Signing Config Arn",
          description:
            "To enable code signing for this function, specify the ARN of a code-signing configuration.",
          type: "string",
          required: false,
        },
        Architectures: {
          name: "Architectures",
          description:
            "The instruction set architecture that the function supports.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["x86_64", "arm64"],
            },
          },
          required: false,
        },
        EphemeralStorage: {
          name: "Ephemeral Storage",
          description: "The size of the function's /tmp directory in MB.",
          type: {
            type: "object",
            properties: {
              Size: {
                type: "number",
              },
            },
            required: ["Size"],
            additionalProperties: false,
          },
          required: false,
        },
        SnapStart: {
          name: "Snap Start",
          description: "The function's SnapStart setting.",
          type: {
            type: "object",
            properties: {
              ApplyOn: {
                type: "string",
                enum: ["PublishedVersions", "None"],
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        LoggingConfig: {
          name: "Logging Config",
          description:
            "The function's Amazon CloudWatch Logs configuration settings.",
          type: {
            type: "object",
            properties: {
              LogFormat: {
                type: "string",
                enum: ["JSON", "Text"],
              },
              ApplicationLogLevel: {
                type: "string",
                enum: ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
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
          required: false,
        },
        CapacityProviderConfig: {
          name: "Capacity Provider Config",
          description:
            "Configuration for the capacity provider that manages compute resources for Lambda functions.",
          type: {
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
          required: false,
        },
        PublishTo: {
          name: "Publish To",
          description:
            "Specifies where to publish the function version or configuration.",
          type: {
            type: "string",
            enum: ["LATEST_PUBLISHED"],
          },
          required: false,
        },
        DurableConfig: {
          name: "Durable Config",
          description: "Configuration settings for durable functions.",
          type: {
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
          required: false,
        },
        TenancyConfig: {
          name: "Tenancy Config",
          description:
            "Configuration for multi-tenant applications that use Lambda functions.",
          type: {
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

        const command = new CreateFunctionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Function Result",
      description: "Result from CreateFunction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FunctionName: {
            type: "string",
            description: "The name of the function.",
          },
          FunctionArn: {
            type: "string",
            description: "The function's Amazon Resource Name (ARN).",
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
            description: "The identifier of the function's runtime.",
          },
          Role: {
            type: "string",
            description: "The function's execution role.",
          },
          Handler: {
            type: "string",
            description:
              "The function that Lambda calls to begin running your function.",
          },
          CodeSize: {
            type: "number",
            description:
              "The size of the function's deployment package, in bytes.",
          },
          Description: {
            type: "string",
            description: "The function's description.",
          },
          Timeout: {
            type: "number",
            description:
              "The amount of time in seconds that Lambda allows a function to run before stopping it.",
          },
          MemorySize: {
            type: "number",
            description:
              "The amount of memory available to the function at runtime.",
          },
          LastModified: {
            type: "string",
            description:
              "The date and time that the function was last updated, in ISO-8601 format (YYYY-MM-DDThh:mm:ss.",
          },
          CodeSha256: {
            type: "string",
            description:
              "The SHA256 hash of the function's deployment package.",
          },
          Version: {
            type: "string",
            description: "The version of the Lambda function.",
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
            description: "The function's networking configuration.",
          },
          DeadLetterConfig: {
            type: "object",
            properties: {
              TargetArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The function's dead letter queue.",
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
            description: "The function's environment variables.",
          },
          KMSKeyArn: {
            type: "string",
            description:
              "The ARN of the Key Management Service (KMS) customer managed key that's used to encrypt the following resources: The function's environment variables.",
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
            description: "The function's X-Ray tracing configuration.",
          },
          MasterArn: {
            type: "string",
            description:
              "For Lambda@Edge functions, the ARN of the main function.",
          },
          RevisionId: {
            type: "string",
            description:
              "The latest updated revision of the function or alias.",
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
            description: "The function's layers.",
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
            description: "The current state of the function.",
          },
          StateReason: {
            type: "string",
            description: "The reason for the function's current state.",
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
            description: "The reason code for the function's current state.",
          },
          LastUpdateStatus: {
            type: "string",
            enum: ["Successful", "Failed", "InProgress"],
            description:
              "The status of the last update that was performed on the function.",
          },
          LastUpdateStatusReason: {
            type: "string",
            description:
              "The reason for the last update that was performed on the function.",
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
            description:
              "The reason code for the last update that was performed on the function.",
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
            description:
              "Connection settings for an Amazon EFS file system or an Amazon S3 Files file system.",
          },
          PackageType: {
            type: "string",
            enum: ["Zip", "Image"],
            description: "The type of deployment package.",
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
                      type: "string",
                    },
                  },
                  Command: {
                    type: "array",
                    items: {
                      type: "string",
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
            description: "The function's image configuration values.",
          },
          SigningProfileVersionArn: {
            type: "string",
            description: "The ARN of the signing profile version.",
          },
          SigningJobArn: {
            type: "string",
            description: "The ARN of the signing job.",
          },
          Architectures: {
            type: "array",
            items: {
              type: "string",
              enum: ["x86_64", "arm64"],
            },
            description:
              "The instruction set architecture that the function supports.",
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
            description: "The size of the function's /tmp directory in MB.",
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
            description:
              "Set ApplyOn to PublishedVersions to create a snapshot of the initialized execution environment when you publish a function version.",
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
            description: "The ARN of the runtime and any errors that occured.",
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
                enum: ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
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
            description:
              "The function's Amazon CloudWatch Logs configuration settings.",
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
            description:
              "Configuration for the capacity provider that manages compute resources for Lambda functions.",
          },
          ConfigSha256: {
            type: "string",
            description: "The SHA256 hash of the function configuration.",
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
            description:
              "The function's durable execution configuration settings, if the function is configured for durability.",
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
            description:
              "The function's tenant isolation configuration settings.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createFunction;
