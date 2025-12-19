import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeDocumentPermissionCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDocumentPermission: AppBlock = {
  name: "Describe Document Permission",
  description: `Describes the permissions for a Amazon Web Services Systems Manager document (SSM document).`,
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
        Name: {
          name: "Name",
          description: "The name of the document for which you are the owner.",
          type: "string",
          required: true,
        },
        PermissionType: {
          name: "Permission Type",
          description: "The permission type for the document.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDocumentPermissionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Document Permission Result",
      description: "Result from DescribeDocumentPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountIds: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The account IDs that have permission to use this document.",
          },
          AccountSharingInfoList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AccountId: {
                  type: "string",
                },
                SharedDocumentVersion: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of Amazon Web Services accounts where the current document is shared and the version shared with each account.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDocumentPermission;
