import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  GetCalculationExecutionCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCalculationExecution: AppBlock = {
  name: "Get Calculation Execution",
  description: `Describes a previously submitted calculation execution.`,
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
        CalculationExecutionId: {
          name: "Calculation Execution Id",
          description: "The calculation execution UUID.",
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

        const command = new GetCalculationExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Calculation Execution Result",
      description: "Result from GetCalculationExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CalculationExecutionId: {
            type: "string",
            description: "The calculation execution UUID.",
          },
          SessionId: {
            type: "string",
            description: "The session ID that the calculation ran in.",
          },
          Description: {
            type: "string",
            description: "The description of the calculation execution.",
          },
          WorkingDirectory: {
            type: "string",
            description:
              "The Amazon S3 location in which calculation results are stored.",
          },
          Status: {
            type: "object",
            properties: {
              SubmissionDateTime: {
                type: "string",
              },
              CompletionDateTime: {
                type: "string",
              },
              State: {
                type: "string",
              },
              StateChangeReason: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains information about the status of the calculation.",
          },
          Statistics: {
            type: "object",
            properties: {
              DpuExecutionInMillis: {
                type: "number",
              },
              Progress: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains information about the data processing unit (DPU) execution time and progress.",
          },
          Result: {
            type: "object",
            properties: {
              StdOutS3Uri: {
                type: "string",
              },
              StdErrorS3Uri: {
                type: "string",
              },
              ResultS3Uri: {
                type: "string",
              },
              ResultType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Contains result information.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getCalculationExecution;
