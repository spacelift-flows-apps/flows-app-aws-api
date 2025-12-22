import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  ModifyDBClusterSnapshotAttributeCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBClusterSnapshotAttribute: AppBlock = {
  name: "Modify DB Cluster Snapshot Attribute",
  description: `Adds an attribute and values to, or removes an attribute and values from, a manual DB cluster snapshot.`,
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
        DBClusterSnapshotIdentifier: {
          name: "DB Cluster Snapshot Identifier",
          description:
            "The identifier for the DB cluster snapshot to modify the attributes for.",
          type: "string",
          required: true,
        },
        AttributeName: {
          name: "Attribute Name",
          description:
            "The name of the DB cluster snapshot attribute to modify.",
          type: "string",
          required: true,
        },
        ValuesToAdd: {
          name: "Values To Add",
          description:
            "A list of DB cluster snapshot attributes to add to the attribute specified by AttributeName.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ValuesToRemove: {
          name: "Values To Remove",
          description:
            "A list of DB cluster snapshot attributes to remove from the attribute specified by AttributeName.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyDBClusterSnapshotAttributeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Cluster Snapshot Attribute Result",
      description: "Result from ModifyDBClusterSnapshotAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterSnapshotAttributesResult: {
            type: "object",
            properties: {
              DBClusterSnapshotIdentifier: {
                type: "string",
              },
              DBClusterSnapshotAttributes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    AttributeName: {
                      type: "string",
                    },
                    AttributeValues: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Contains the results of a successful call to the DescribeDBClusterSnapshotAttributes API action.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyDBClusterSnapshotAttribute;
