import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  BatchGetPreparedStatementCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const batchGetPreparedStatement: AppBlock = {
  name: "Batch Get Prepared Statement",
  description: `Returns the details of a single prepared statement or a list of up to 256 prepared statements for the array of prepared statement names that you provide.`,
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
        PreparedStatementNames: {
          name: "Prepared Statement Names",
          description: "A list of prepared statement names to return.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        WorkGroup: {
          name: "Work Group",
          description:
            "The name of the workgroup to which the prepared statements belong.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new BatchGetPreparedStatementCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Batch Get Prepared Statement Result",
      description: "Result from BatchGetPreparedStatement operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PreparedStatements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StatementName: {
                  type: "string",
                },
                QueryStatement: {
                  type: "string",
                },
                WorkGroupName: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                LastModifiedTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of prepared statements returned.",
          },
          UnprocessedPreparedStatementNames: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StatementName: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of one or more prepared statements that were requested but could not be returned.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default batchGetPreparedStatement;
