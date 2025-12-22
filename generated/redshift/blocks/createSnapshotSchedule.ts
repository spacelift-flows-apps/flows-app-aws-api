import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateSnapshotScheduleCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createSnapshotSchedule: AppBlock = {
  name: "Create Snapshot Schedule",
  description: `Create a snapshot schedule that can be associated to a cluster and which overrides the default system backup schedule.`,
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
        ScheduleDefinitions: {
          name: "Schedule Definitions",
          description: "The definition of the snapshot schedule.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ScheduleIdentifier: {
          name: "Schedule Identifier",
          description: "A unique identifier for a snapshot schedule.",
          type: "string",
          required: false,
        },
        ScheduleDescription: {
          name: "Schedule Description",
          description: "The description of the snapshot schedule.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "An optional set of tags you can use to search for the schedule.",
          type: {
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
              additionalProperties: false,
            },
          },
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description: "",
          type: "boolean",
          required: false,
        },
        NextInvocations: {
          name: "Next Invocations",
          description: "",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateSnapshotScheduleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Snapshot Schedule Result",
      description: "Result from CreateSnapshotSchedule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScheduleDefinitions: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of ScheduleDefinitions.",
          },
          ScheduleIdentifier: {
            type: "string",
            description: "A unique identifier for the schedule.",
          },
          ScheduleDescription: {
            type: "string",
            description: "The description of the schedule.",
          },
          Tags: {
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
              additionalProperties: false,
            },
            description: "An optional set of tags describing the schedule.",
          },
          NextInvocations: {
            type: "array",
            items: {
              type: "string",
            },
            description: "",
          },
          AssociatedClusterCount: {
            type: "number",
            description: "The number of clusters associated with the schedule.",
          },
          AssociatedClusters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ClusterIdentifier: {
                  type: "string",
                },
                ScheduleAssociationState: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of clusters associated with the schedule.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createSnapshotSchedule;
