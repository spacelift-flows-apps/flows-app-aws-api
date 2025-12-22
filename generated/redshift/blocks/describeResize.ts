import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeResizeCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeResize: AppBlock = {
  name: "Describe Resize",
  description: `Returns information about the last resize operation for the specified cluster.`,
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
            "The unique identifier of a cluster whose resize progress you are requesting.",
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

        const command = new DescribeResizeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Resize Result",
      description: "Result from DescribeResize operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TargetNodeType: {
            type: "string",
            description:
              "The node type that the cluster will have after the resize operation is complete.",
          },
          TargetNumberOfNodes: {
            type: "number",
            description:
              "The number of nodes that the cluster will have after the resize operation is complete.",
          },
          TargetClusterType: {
            type: "string",
            description:
              "The cluster type after the resize operation is complete.",
          },
          Status: {
            type: "string",
            description: "The status of the resize operation.",
          },
          ImportTablesCompleted: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The names of tables that have been completely imported .",
          },
          ImportTablesInProgress: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The names of tables that are being currently imported.",
          },
          ImportTablesNotStarted: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The names of tables that have not been yet imported.",
          },
          AvgResizeRateInMegaBytesPerSecond: {
            type: "number",
            description:
              "The average rate of the resize operation over the last few minutes, measured in megabytes per second.",
          },
          TotalResizeDataInMegaBytes: {
            type: "number",
            description:
              "The estimated total amount of data, in megabytes, on the cluster before the resize operation began.",
          },
          ProgressInMegaBytes: {
            type: "number",
            description:
              "While the resize operation is in progress, this value shows the current amount of data, in megabytes, that has been processed so far.",
          },
          ElapsedTimeInSeconds: {
            type: "number",
            description:
              "The amount of seconds that have elapsed since the resize operation began.",
          },
          EstimatedTimeToCompletionInSeconds: {
            type: "number",
            description:
              "The estimated time remaining, in seconds, until the resize operation is complete.",
          },
          ResizeType: {
            type: "string",
            description:
              "An enum with possible values of ClassicResize and ElasticResize.",
          },
          Message: {
            type: "string",
            description:
              "An optional string to provide additional details about the resize action.",
          },
          TargetEncryptionType: {
            type: "string",
            description:
              "The type of encryption for the cluster after the resize is complete.",
          },
          DataTransferProgressPercent: {
            type: "number",
            description:
              "The percent of data transferred from source cluster to target cluster.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeResize;
