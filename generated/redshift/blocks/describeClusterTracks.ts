import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeClusterTracksCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeClusterTracks: AppBlock = {
  name: "Describe Cluster Tracks",
  description: `Returns a list of all the available maintenance tracks.`,
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
        MaintenanceTrackName: {
          name: "Maintenance Track Name",
          description: "The name of the maintenance track.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "An integer value for the maximum number of maintenance tracks to return.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeClusterTracksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Cluster Tracks Result",
      description: "Result from DescribeClusterTracks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MaintenanceTracks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                MaintenanceTrackName: {
                  type: "string",
                },
                DatabaseVersion: {
                  type: "string",
                },
                UpdateTargets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      MaintenanceTrackName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      DatabaseVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SupportedOperations: {
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
              "A list of maintenance tracks output by the DescribeClusterTracks operation.",
          },
          Marker: {
            type: "string",
            description:
              "The starting point to return a set of response tracklist records.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeClusterTracks;
