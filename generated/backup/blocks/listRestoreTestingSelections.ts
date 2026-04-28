import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListRestoreTestingSelectionsCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRestoreTestingSelections: AppBlock = {
  name: "List Restore Testing Selections",
  description: `Returns a list of restore testing selections.`,
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
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to be returned.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The next item following a partial list of returned items.",
          type: "string",
          required: false,
        },
        RestoreTestingPlanName: {
          name: "Restore Testing Plan Name",
          description:
            "Returns restore testing selections by the specified restore testing plan name.",
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

        const command = new ListRestoreTestingSelectionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Restore Testing Selections Result",
      description: "Result from ListRestoreTestingSelections operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
          RestoreTestingSelections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CreationTime: {
                  type: "string",
                },
                IamRoleArn: {
                  type: "string",
                },
                ProtectedResourceType: {
                  type: "string",
                },
                RestoreTestingPlanName: {
                  type: "string",
                },
                RestoreTestingSelectionName: {
                  type: "string",
                },
                ValidationWindowHours: {
                  type: "number",
                },
              },
              required: [
                "CreationTime",
                "IamRoleArn",
                "ProtectedResourceType",
                "RestoreTestingPlanName",
                "RestoreTestingSelectionName",
              ],
              additionalProperties: false,
            },
            description:
              "The returned restore testing selections associated with the restore testing plan.",
          },
        },
        required: ["RestoreTestingSelections"],
      },
    },
  },
};

export default listRestoreTestingSelections;
