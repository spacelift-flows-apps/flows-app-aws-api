import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeInstanceStatusCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceStatus: AppBlock = {
  name: "Describe Instance Status",
  description: `Describes the status of the specified instances or all of your instances.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description: "The instance IDs.",
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
        IncludeManagedResources: {
          name: "Include Managed Resources",
          description:
            "Indicates whether to include managed resources in the output.",
          type: "boolean",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
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
        IncludeAllInstances: {
          name: "Include All Instances",
          description:
            "When true, includes the health status for all instances.",
          type: "boolean",
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

        const command = new DescribeInstanceStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Status Result",
      description: "Result from DescribeInstanceStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceStatuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AvailabilityZone: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                OutpostArn: {
                  type: "string",
                },
                Operator: {
                  type: "object",
                  properties: {
                    Managed: {
                      type: "boolean",
                    },
                    Principal: {
                      type: "string",
                    },
                    HiddenByDefault: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                Events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      InstanceEventId: {
                        type: "string",
                      },
                      Code: {
                        type: "string",
                        enum: [
                          "instance-reboot",
                          "system-reboot",
                          "system-maintenance",
                          "instance-retirement",
                          "instance-stop",
                        ],
                      },
                      Description: {
                        type: "string",
                      },
                      NotAfter: {
                        type: "string",
                      },
                      NotBefore: {
                        type: "string",
                      },
                      NotBeforeDeadline: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                InstanceId: {
                  type: "string",
                },
                InstanceState: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "number",
                    },
                    Name: {
                      type: "string",
                      enum: [
                        "pending",
                        "running",
                        "shutting-down",
                        "terminated",
                        "stopping",
                        "stopped",
                      ],
                    },
                  },
                  additionalProperties: false,
                },
                InstanceStatus: {
                  type: "object",
                  properties: {
                    Details: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ImpairedSince: {},
                          Name: {},
                          Status: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Status: {
                      type: "string",
                      enum: [
                        "ok",
                        "impaired",
                        "insufficient-data",
                        "not-applicable",
                        "initializing",
                      ],
                    },
                  },
                  additionalProperties: false,
                },
                SystemStatus: {
                  type: "object",
                  properties: {
                    Details: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ImpairedSince: {},
                          Name: {},
                          Status: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Status: {
                      type: "string",
                      enum: [
                        "ok",
                        "impaired",
                        "insufficient-data",
                        "not-applicable",
                        "initializing",
                      ],
                    },
                  },
                  additionalProperties: false,
                },
                AttachedEbsStatus: {
                  type: "object",
                  properties: {
                    Details: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ImpairedSince: {},
                          Name: {},
                          Status: {},
                        },
                        additionalProperties: false,
                      },
                    },
                    Status: {
                      type: "string",
                      enum: [
                        "ok",
                        "impaired",
                        "insufficient-data",
                        "not-applicable",
                        "initializing",
                      ],
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the status of the instances.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceStatus;
