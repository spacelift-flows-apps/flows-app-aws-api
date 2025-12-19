import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeImportSnapshotTasksCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeImportSnapshotTasks: AppBlock = {
  name: "Describe Import Snapshot Tasks",
  description: `Describes your import snapshot tasks.`,
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
          description: "The filters.",
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
          description: "A list of import snapshot task IDs.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeImportSnapshotTasksCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Import Snapshot Tasks Result",
      description: "Result from DescribeImportSnapshotTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImportSnapshotTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Description: {
                  type: "string",
                },
                ImportTaskId: {
                  type: "string",
                },
                SnapshotTaskDetail: {
                  type: "object",
                  properties: {
                    Description: {
                      type: "string",
                    },
                    DiskImageSize: {
                      type: "number",
                    },
                    Encrypted: {
                      type: "boolean",
                    },
                    Format: {
                      type: "string",
                    },
                    KmsKeyId: {
                      type: "string",
                    },
                    Progress: {
                      type: "string",
                    },
                    SnapshotId: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    StatusMessage: {
                      type: "string",
                    },
                    Url: {
                      type: "string",
                    },
                    UserBucket: {
                      type: "object",
                      properties: {
                        S3Bucket: {
                          type: "object",
                          additionalProperties: true,
                        },
                        S3Key: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
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
              },
              additionalProperties: false,
            },
            description:
              "A list of zero or more import snapshot tasks that are currently active or were completed or canceled in the previous 7 days.",
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

export default describeImportSnapshotTasks;
