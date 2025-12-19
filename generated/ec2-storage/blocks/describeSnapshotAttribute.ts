import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeSnapshotAttributeCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSnapshotAttribute: AppBlock = {
  name: "Describe Snapshot Attribute",
  description: `Describes the specified attribute of the specified snapshot.`,
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
          description: "The snapshot attribute you would like to view.",
          type: "string",
          required: true,
        },
        SnapshotId: {
          name: "Snapshot Id",
          description: "The ID of the EBS snapshot.",
          type: "string",
          required: true,
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

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeSnapshotAttributeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Snapshot Attribute Result",
      description: "Result from DescribeSnapshotAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ProductCodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ProductCodeId: {
                  type: "string",
                },
                ProductCodeType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The product codes.",
          },
          SnapshotId: {
            type: "string",
            description: "The ID of the EBS snapshot.",
          },
          CreateVolumePermissions: {
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
            description:
              "The users and groups that have the permissions for creating volumes from the snapshot.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSnapshotAttribute;
