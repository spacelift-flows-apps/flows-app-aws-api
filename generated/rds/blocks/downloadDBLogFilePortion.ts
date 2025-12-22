import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DownloadDBLogFilePortionCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const downloadDBLogFilePortion: AppBlock = {
  name: "Download DB Log File Portion",
  description: `Downloads all or a portion of the specified log file, up to 1 MB in size.`,
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
        DBInstanceIdentifier: {
          name: "DB Instance Identifier",
          description:
            "The customer-assigned name of the DB instance that contains the log files you want to list.",
          type: "string",
          required: true,
        },
        LogFileName: {
          name: "Log File Name",
          description: "The name of the log file to be downloaded.",
          type: "string",
          required: true,
        },
        Marker: {
          name: "Marker",
          description:
            'The pagination token provided in the previous request or "0".',
          type: "string",
          required: false,
        },
        NumberOfLines: {
          name: "Number Of Lines",
          description: "The number of lines to download.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DownloadDBLogFilePortionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Download DB Log File Portion Result",
      description: "Result from DownloadDBLogFilePortion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LogFileData: {
            type: "string",
            description: "Entries from the specified log file.",
          },
          Marker: {
            type: "string",
            description:
              "A pagination token that can be used in a later DownloadDBLogFilePortion request.",
          },
          AdditionalDataPending: {
            type: "boolean",
            description:
              "A Boolean value that, if true, indicates there is more data to be downloaded.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default downloadDBLogFilePortion;
