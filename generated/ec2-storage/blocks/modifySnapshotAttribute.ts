import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifySnapshotAttributeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifySnapshotAttribute: AppBlock = {
  name: "Modify Snapshot Attribute",
  description: `Adds or removes permission settings for the specified snapshot.`,
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
        Attribute: {
          name: "Attribute",
          description: "The snapshot attribute to modify.",
          type: "string",
          required: false,
        },
        CreateVolumePermission: {
          name: "Create Volume Permission",
          description:
            "A JSON representation of the snapshot attribute modification.",
          type: {
            type: "object",
            properties: {
              Add: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    UserId: {
                      type: "string",
                    },
                    Group: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Remove: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    UserId: {
                      type: "string",
                    },
                    Group: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        GroupNames: {
          name: "Group Names",
          description: "The group to modify for the snapshot.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        OperationType: {
          name: "Operation Type",
          description: "The type of operation to perform to the attribute.",
          type: "string",
          required: false,
        },
        SnapshotId: {
          name: "Snapshot Id",
          description: "The ID of the snapshot.",
          type: "string",
          required: true,
        },
        UserIds: {
          name: "User Ids",
          description: "The account ID to modify for the snapshot.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifySnapshotAttributeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Snapshot Attribute Result",
      description: "Result from ModifySnapshotAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default modifySnapshotAttribute;
