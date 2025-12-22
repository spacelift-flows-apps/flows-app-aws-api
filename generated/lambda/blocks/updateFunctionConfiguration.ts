import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateFunctionConfiguration: AppBlock = {
  name: "Update Function Configuration",
  description: `Modify the version-specific settings of a Lambda function.`,
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
        Role: {
          name: "Role",
          description:
            "The Amazon Resource Name (ARN) of the function's execution role.",
          type: "string",
          required: false,
        },
        Handler: {
          name: "Handler",
          description:
            "The name of the method within your code that Lambda calls to run your function.",
          type: "string",
          required: false,
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
        Runtime: {
          name: "Runtime",
          description: "The identifier of the function's runtime.",
          type: "string",
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
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        RevisionId: {
          name: "Revision Id",
          description:
            "Update the function only if the revision ID matches the ID that's specified.",
          type: "string",
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
          description: "Connection settings for an Amazon EFS file system.",
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
            "Container image configuration values that override the values in the container image Docker file.",
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
        }

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateFunctionConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Function Configuration Result",
      description: "Result from UpdateFunctionConfiguration operation",
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
            description: "The current state of the function.",
          },
          StateReason: {
            type: "string",
            description: "The reason for the function's current state.",
          },
          StateReasonCode: {
            type: "string",
            description: "The reason code for the function's current state.",
          },
          LastUpdateStatus: {
            type: "string",
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
            description: "Connection settings for an Amazon EFS file system.",
          },
          PackageType: {
            type: "string",
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
              },
              OptimizationStatus: {
                type: "string",
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
            description:
              "The function's Amazon CloudWatch Logs configuration settings.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateFunctionConfiguration;
