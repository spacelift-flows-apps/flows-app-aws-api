import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListIndexedRecoveryPointsCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listIndexedRecoveryPoints: AppBlock = {
  name: "List Indexed Recovery Points",
  description: `This operation returns a list of recovery points that have an associated index, belonging to the specified account.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "The next item following a partial list of returned recovery points.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of resource list items to be returned.",
          type: "number",
          required: false,
        },
        SourceResourceArn: {
          name: "Source Resource Arn",
          description:
            "A string of the Amazon Resource Name (ARN) that uniquely identifies the source resource.",
          type: "string",
          required: false,
        },
        CreatedBefore: {
          name: "Created Before",
          description:
            "Returns only indexed recovery points that were created before the specified date.",
          type: "string",
          required: false,
        },
        CreatedAfter: {
          name: "Created After",
          description:
            "Returns only indexed recovery points that were created after the specified date.",
          type: "string",
          required: false,
        },
        ResourceType: {
          name: "Resource Type",
          description:
            "Returns a list of indexed recovery points for the specified resource type(s).",
          type: "string",
          required: false,
        },
        IndexStatus: {
          name: "Index Status",
          description:
            "Include this parameter to filter the returned list by the indicated statuses.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListIndexedRecoveryPointsCommand(
          convertTimestamps(
            commandInput,
            new Set(["CreatedBefore", "CreatedAfter"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Indexed Recovery Points Result",
      description: "Result from ListIndexedRecoveryPoints operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IndexedRecoveryPoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                RecoveryPointArn: {
                  type: "string",
                },
                SourceResourceArn: {
                  type: "string",
                },
                IamRoleArn: {
                  type: "string",
                },
                BackupCreationDate: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                IndexCreationDate: {
                  type: "string",
                },
                IndexStatus: {
                  type: "string",
                },
                IndexStatusMessage: {
                  type: "string",
                },
                BackupVaultArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "This is a list of recovery points that have an associated index, belonging to the specified account.",
          },
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned recovery points.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listIndexedRecoveryPoints;
