import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  UpdateLookupTableCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateLookupTable: AppBlock = {
  name: "Update Lookup Table",
  description: `Updates an existing lookup table by replacing all of its CSV content.`,
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
        lookupTableArn: {
          name: "lookup Table Arn",
          description: "The ARN of the lookup table to update.",
          type: "string",
          required: true,
        },
        description: {
          name: "description",
          description: "An updated description of the lookup table.",
          type: "string",
          required: false,
        },
        tableBody: {
          name: "table Body",
          description: "The new CSV content to replace the existing data.",
          type: "string",
          required: true,
        },
        kmsKeyId: {
          name: "kms Key Id",
          description:
            "The ARN of the KMS key to use to encrypt the lookup table data.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateLookupTableCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Lookup Table Result",
      description: "Result from UpdateLookupTable operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          lookupTableArn: {
            type: "string",
            description: "The ARN of the lookup table that was updated.",
          },
          lastUpdatedTime: {
            type: "number",
            description:
              "The time when the lookup table was last updated, expressed as the number of milliseconds after Jan 1, 1970 00:00:00 UTC.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateLookupTable;
