import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeVolumeStatusCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeVolumeStatus: AppBlock = {
  name: "Describe Volume Status",
  description: `Describes the status of the specified volumes.`,
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
          required: false,
        },
        VolumeIds: {
          name: "Volume Ids",
          description: "The IDs of the volumes.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DescribeVolumeStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Volume Status Result",
      description: "Result from DescribeVolumeStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          VolumeStatuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Code: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                AvailabilityZone: {
                  type: "string",
                },
                OutpostArn: {
                  type: "string",
                },
                Events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EventType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NotAfter: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NotBefore: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                VolumeId: {
                  type: "string",
                },
                VolumeStatus: {
                  type: "object",
                  properties: {
                    Details: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                AttachmentStatuses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      IoPerformance: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                InitializationStatusDetails: {
                  type: "object",
                  properties: {
                    InitializationType: {
                      type: "string",
                    },
                    Progress: {
                      type: "number",
                    },
                    EstimatedTimeToCompleteInSeconds: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                AvailabilityZoneId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the status of the volumes.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeVolumeStatus;
