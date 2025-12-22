import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeNodeConfigurationOptionsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeNodeConfigurationOptions: AppBlock = {
  name: "Describe Node Configuration Options",
  description: `Returns properties of possible node configurations such as node type, number of nodes, and disk usage for the specified action type.`,
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
        ActionType: {
          name: "Action Type",
          description:
            "The action type to evaluate for possible node configurations.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the cluster to evaluate for possible node configurations.",
          type: "string",
          required: false,
        },
        SnapshotIdentifier: {
          name: "Snapshot Identifier",
          description:
            "The identifier of the snapshot to evaluate for possible node configurations.",
          type: "string",
          required: false,
        },
        SnapshotArn: {
          name: "Snapshot Arn",
          description:
            "The Amazon Resource Name (ARN) of the snapshot associated with the message to describe node configuration.",
          type: "string",
          required: false,
        },
        OwnerAccount: {
          name: "Owner Account",
          description:
            "The Amazon Web Services account used to create or copy the snapshot.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "A set of name, operator, and value items to filter the results.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Operator: {
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

        const command = new DescribeNodeConfigurationOptionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Node Configuration Options Result",
      description: "Result from DescribeNodeConfigurationOptions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NodeConfigurationOptionList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                NodeType: {
                  type: "string",
                },
                NumberOfNodes: {
                  type: "number",
                },
                EstimatedDiskUtilizationPercent: {
                  type: "number",
                },
                Mode: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of valid node configurations.",
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

export default describeNodeConfigurationOptions;
