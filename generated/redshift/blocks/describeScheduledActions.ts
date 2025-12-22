import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeScheduledActionsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeScheduledActions: AppBlock = {
  name: "Describe Scheduled Actions",
  description: `Describes properties of scheduled actions.`,
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
        ScheduledActionName: {
          name: "Scheduled Action Name",
          description: "The name of the scheduled action to retrieve.",
          type: "string",
          required: false,
        },
        TargetActionType: {
          name: "Target Action Type",
          description: "The type of the scheduled actions to retrieve.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description:
            "The start time in UTC of the scheduled actions to retrieve.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "The end time in UTC of the scheduled action to retrieve.",
          type: "string",
          required: false,
        },
        Active: {
          name: "Active",
          description: "If true, retrieve only active scheduled actions.",
          type: "boolean",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "List of scheduled action filters.",
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
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeScheduledActionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Scheduled Actions Result",
      description: "Result from DescribeScheduledActions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description:
              "An optional parameter that specifies the starting point to return a set of response records.",
          },
          ScheduledActions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ScheduledActionName: {
                  type: "string",
                },
                TargetAction: {
                  type: "object",
                  properties: {
                    ResizeCluster: {
                      type: "object",
                      properties: {
                        ClusterIdentifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ClusterType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NodeType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        NumberOfNodes: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Classic: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReservedNodeId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TargetReservedNodeOfferingId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ClusterIdentifier"],
                      additionalProperties: false,
                    },
                    PauseCluster: {
                      type: "object",
                      properties: {
                        ClusterIdentifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ClusterIdentifier"],
                      additionalProperties: false,
                    },
                    ResumeCluster: {
                      type: "object",
                      properties: {
                        ClusterIdentifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ClusterIdentifier"],
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                Schedule: {
                  type: "string",
                },
                IamRole: {
                  type: "string",
                },
                ScheduledActionDescription: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                NextInvocations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "List of retrieved scheduled actions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeScheduledActions;
