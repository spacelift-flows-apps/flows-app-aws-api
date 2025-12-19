import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBLogFilesCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBLogFiles: AppBlock = {
  name: "Describe DB Log Files",
  description: `Returns a list of DB log files for the DB instance.`,
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
        FilenameContains: {
          name: "Filename Contains",
          description:
            "Filters the available log files for log file names that contain the specified string.",
          type: "string",
          required: false,
        },
        FileLastWritten: {
          name: "File Last Written",
          description:
            "Filters the available log files for files written since the specified date, in POSIX timestamp format with milliseconds.",
          type: "number",
          required: false,
        },
        FileSize: {
          name: "File Size",
          description:
            "Filters the available log files for files larger than the specified size.",
          type: "number",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter isn't currently supported.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The pagination token provided in the previous request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBLogFilesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Log Files Result",
      description: "Result from DescribeDBLogFiles operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DescribeDBLogFiles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LogFileName: {
                  type: "string",
                },
                LastWritten: {
                  type: "number",
                },
                Size: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The DB log files returned.",
          },
          Marker: {
            type: "string",
            description:
              "A pagination token that can be used in a later DescribeDBLogFiles request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBLogFiles;
