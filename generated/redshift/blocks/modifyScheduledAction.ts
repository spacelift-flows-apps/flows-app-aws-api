import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  ModifyScheduledActionCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyScheduledAction: AppBlock = {
  name: "Modify Scheduled Action",
  description: `Modifies a scheduled action.`,
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
          description: "The name of the scheduled action to modify.",
          type: "string",
          required: true,
        },
        TargetAction: {
          name: "Target Action",
          description: "A modified JSON format of the scheduled action.",
          type: {
            type: "object",
            properties: {
              ResizeCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                  ClusterType: {
                    type: "string",
                  },
                  NodeType: {
                    type: "string",
                  },
                  NumberOfNodes: {
                    type: "number",
                  },
                  Classic: {
                    type: "boolean",
                  },
                  ReservedNodeId: {
                    type: "string",
                  },
                  TargetReservedNodeOfferingId: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
              PauseCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
              ResumeCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Schedule: {
          name: "Schedule",
          description: "A modified schedule in either at( ) or cron( ) format.",
          type: "string",
          required: false,
        },
        IamRole: {
          name: "Iam Role",
          description:
            "A different IAM role to assume to run the target action.",
          type: "string",
          required: false,
        },
        ScheduledActionDescription: {
          name: "Scheduled Action Description",
          description: "A modified description of the scheduled action.",
          type: "string",
          required: false,
        },
        StartTime: {
          name: "Start Time",
          description: "A modified start time of the scheduled action.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description: "A modified end time of the scheduled action.",
          type: "string",
          required: false,
        },
        Enable: {
          name: "Enable",
          description: "A modified enable flag of the scheduled action.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyScheduledActionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Scheduled Action Result",
      description: "Result from ModifyScheduledAction operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScheduledActionName: {
            type: "string",
            description: "The name of the scheduled action.",
          },
          TargetAction: {
            type: "object",
            properties: {
              ResizeCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                  ClusterType: {
                    type: "string",
                  },
                  NodeType: {
                    type: "string",
                  },
                  NumberOfNodes: {
                    type: "number",
                  },
                  Classic: {
                    type: "boolean",
                  },
                  ReservedNodeId: {
                    type: "string",
                  },
                  TargetReservedNodeOfferingId: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
              PauseCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
              ResumeCluster: {
                type: "object",
                properties: {
                  ClusterIdentifier: {
                    type: "string",
                  },
                },
                required: ["ClusterIdentifier"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description:
              "A JSON format string of the Amazon Redshift API operation with input parameters.",
          },
          Schedule: {
            type: "string",
            description:
              "The schedule for a one-time (at format) or recurring (cron format) scheduled action.",
          },
          IamRole: {
            type: "string",
            description: "The IAM role to assume to run the scheduled action.",
          },
          ScheduledActionDescription: {
            type: "string",
            description: "The description of the scheduled action.",
          },
          State: {
            type: "string",
            description: "The state of the scheduled action.",
          },
          NextInvocations: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of times when the scheduled action will run.",
          },
          StartTime: {
            type: "string",
            description: "The start time in UTC when the schedule is active.",
          },
          EndTime: {
            type: "string",
            description:
              "The end time in UTC when the schedule is no longer active.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyScheduledAction;
