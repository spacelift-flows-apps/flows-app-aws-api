import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, DescribeFrameworkCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeFramework: AppBlock = {
  name: "Describe Framework",
  description: `Returns the framework details for the specified FrameworkName.`,
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
        FrameworkName: {
          name: "Framework Name",
          description: "The unique name of a framework.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeFrameworkCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Framework Result",
      description: "Result from DescribeFramework operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FrameworkName: {
            type: "string",
            description: "The unique name of a framework.",
          },
          FrameworkArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a resource.",
          },
          FrameworkDescription: {
            type: "string",
            description: "An optional description of the framework.",
          },
          FrameworkControls: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ControlName: {
                  type: "string",
                },
                ControlInputParameters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ParameterName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ParameterValue: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ControlScope: {
                  type: "object",
                  properties: {
                    ComplianceResourceIds: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    ComplianceResourceTypes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Tags: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["ControlName"],
              additionalProperties: false,
            },
            description: "The controls that make up the framework.",
          },
          CreationTime: {
            type: "string",
            description:
              "The date and time that a framework is created, in ISO 8601 representation.",
          },
          DeploymentStatus: {
            type: "string",
            description: "The deployment status of a framework.",
          },
          FrameworkStatus: {
            type: "string",
            description: "A framework consists of one or more controls.",
          },
          IdempotencyToken: {
            type: "string",
            description:
              "A customer-chosen string that you can use to distinguish between otherwise identical calls to DescribeFrameworkOutput.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeFramework;
