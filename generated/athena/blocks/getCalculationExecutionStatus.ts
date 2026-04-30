import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  GetCalculationExecutionStatusCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCalculationExecutionStatus: AppBlock = {
  name: "Get Calculation Execution Status",
  description: `Gets the status of a current calculation.`,
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

        const command = new GetCalculationExecutionStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Calculation Execution Status Result",
      description: "Result from GetCalculationExecutionStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
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
              "Contains information about the calculation execution status.",
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
              "Contains information about the DPU execution time and progress.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getCalculationExecutionStatus;
