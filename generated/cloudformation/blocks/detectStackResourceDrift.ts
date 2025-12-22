import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DetectStackResourceDriftCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const detectStackResourceDrift: AppBlock = {
  name: "Detect Stack Resource Drift",
  description: `Returns information about whether a resource's actual configuration differs, or has drifted, from its expected configuration, as defined in the stack template and any values specified as template parameters.`,
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
        StackName: {
          name: "Stack Name",
          description: "The name of the stack to which the resource belongs.",
          type: "string",
          required: true,
        },
        LogicalResourceId: {
          name: "Logical Resource Id",
          description:
            "The logical name of the resource for which to return drift information.",
          type: "string",
          required: true,
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DetectStackResourceDriftCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Detect Stack Resource Drift Result",
      description: "Result from DetectStackResourceDrift operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackResourceDrift: {
            type: "object",
            properties: {
              StackId: {
                type: "string",
              },
              LogicalResourceId: {
                type: "string",
              },
              PhysicalResourceId: {
                type: "string",
              },
              PhysicalResourceIdContext: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Key", "Value"],
                  additionalProperties: false,
                },
              },
              ResourceType: {
                type: "string",
              },
              ExpectedProperties: {
                type: "string",
              },
              ActualProperties: {
                type: "string",
              },
              PropertyDifferences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    PropertyPath: {
                      type: "string",
                    },
                    ExpectedValue: {
                      type: "string",
                    },
                    ActualValue: {
                      type: "string",
                    },
                    DifferenceType: {
                      type: "string",
                    },
                  },
                  required: [
                    "PropertyPath",
                    "ExpectedValue",
                    "ActualValue",
                    "DifferenceType",
                  ],
                  additionalProperties: false,
                },
              },
              StackResourceDriftStatus: {
                type: "string",
              },
              Timestamp: {
                type: "string",
              },
              ModuleInfo: {
                type: "object",
                properties: {
                  TypeHierarchy: {
                    type: "string",
                  },
                  LogicalIdHierarchy: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              DriftStatusReason: {
                type: "string",
              },
            },
            required: [
              "StackId",
              "LogicalResourceId",
              "ResourceType",
              "StackResourceDriftStatus",
              "Timestamp",
            ],
            additionalProperties: false,
            description:
              "Information about whether the resource's actual configuration has drifted from its expected template configuration, including actual and expected property values and any differences detected.",
          },
        },
        required: ["StackResourceDrift"],
      },
    },
  },
};

export default detectStackResourceDrift;
