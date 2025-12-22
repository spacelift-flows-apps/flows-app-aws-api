import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeSnapshotSchedulesCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSnapshotSchedules: AppBlock = {
  name: "Describe Snapshot Schedules",
  description: `Returns a list of snapshot schedules.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The unique identifier for the cluster whose snapshot schedules you want to view.",
          type: "string",
          required: false,
        },
        ScheduleIdentifier: {
          name: "Schedule Identifier",
          description: "A unique identifier for a snapshot schedule.",
          type: "string",
          required: false,
        },
        TagKeys: {
          name: "Tag Keys",
          description: "The key value for a snapshot schedule tag.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TagValues: {
          name: "Tag Values",
          description:
            "The value corresponding to the key of the snapshot schedule tag.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "A value that indicates the starting point for the next set of response records in a subsequent request.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number or response records to return in each call.",
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

        const command = new DescribeSnapshotSchedulesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Snapshot Schedules Result",
      description: "Result from DescribeSnapshotSchedules operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SnapshotSchedules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ScheduleDefinitions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                ScheduleIdentifier: {
                  type: "string",
                },
                ScheduleDescription: {
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
                NextInvocations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AssociatedClusterCount: {
                  type: "number",
                },
                AssociatedClusters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ClusterIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ScheduleAssociationState: {
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
            description: "A list of SnapshotSchedules.",
          },
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSnapshotSchedules;
