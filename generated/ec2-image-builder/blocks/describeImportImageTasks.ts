import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeImportImageTasksCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImportImageTasks: AppBlock = {
  name: "Describe Import Image Tasks",
  description: `Displays details about an import virtual machine or import snapshot tasks that are already created.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "Filter tasks using the task-state filter and one of the following values: active, completed, deleting, or deleted.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        ImportTaskIds: {
          name: "Import Task Ids",
          description: "The IDs of the import image tasks.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return in a single call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token that indicates the next page of results.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeImportImageTasksCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Import Image Tasks Result",
      description: "Result from DescribeImportImageTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImportImageTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Architecture: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Encrypted: {
                  type: "boolean",
                },
                Hypervisor: {
                  type: "string",
                },
                ImageId: {
                  type: "string",
                },
                ImportTaskId: {
                  type: "string",
                },
                KmsKeyId: {
                  type: "string",
                },
                LicenseType: {
                  type: "string",
                },
                Platform: {
                  type: "string",
                },
                Progress: {
                  type: "string",
                },
                SnapshotDetails: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DeviceName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DiskImageSize: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Format: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Progress: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SnapshotId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StatusMessage: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Url: {
                        type: "object",
                        additionalProperties: true,
                      },
                      UserBucket: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                LicenseSpecifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      LicenseConfigurationArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                UsageOperation: {
                  type: "string",
                },
                BootMode: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of zero or more import image tasks that are currently active or were completed or canceled in the previous 7 days.",
          },
          NextToken: {
            type: "string",
            description: "The token to use to get the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeImportImageTasks;
