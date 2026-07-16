import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateFunctionCode: AppBlock = {
  name: "Update Function Code",
  description: `Updates a Lambda function's code.`,
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
        ZipFile: {
          name: "Zip File",
          description: "The base64-encoded contents of the deployment package.",
          type: "string",
          required: false,
        },
        S3Bucket: {
          name: "S3Bucket",
          description:
            "An Amazon S3 bucket in the same Amazon Web Services Region as your function.",
          type: "string",
          required: false,
        },
        S3Key: {
          name: "S3Key",
          description: "The Amazon S3 key of the deployment package.",
          type: "string",
          required: false,
        },
        S3ObjectVersion: {
          name: "S3Object Version",
          description:
            "For versioned objects, the version of the deployment package object to use.",
          type: "string",
          required: false,
        },
        ImageUri: {
          name: "Image Uri",
          description: "URI of a container image in the Amazon ECR registry.",
          type: "string",
          required: false,
        },
        Publish: {
          name: "Publish",
          description:
            "Set to true to publish a new version of the function after updating the code.",
          type: "boolean",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Set to true to validate the request parameters and access permissions without modifying the function code.",
          type: "boolean",
          required: false,
        },
        RevisionId: {
          name: "Revision Id",
          description:
            "Update the function only if the revision ID matches the ID that's specified.",
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
        SourceKMSKeyArn: {
          name: "Source KMS Key Arn",
          description:
            "The ARN of the Key Management Service (KMS) customer managed key that's used to encrypt your function's .",
          type: "string",
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

        const command = new UpdateFunctionCodeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Function Code Result",
      description: "Result from UpdateFunctionCode operation",
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

export default updateFunctionCode;
