import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, DescribeExecutionCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeExecution: AppBlock = {
  name: "Describe Execution",
  description: `Provides information about a state machine execution, such as the state machine associated with the execution, the execution input and output, and relevant execution metadata.`,
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
        executionArn: {
          name: "execution Arn",
          description:
            "The Amazon Resource Name (ARN) of the execution to describe.",
          type: "string",
          required: true,
        },
        includedData: {
          name: "included Data",
          description:
            "If your state machine definition is encrypted with a KMS key, callers must have kms:Decrypt permission to decrypt the definition.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Execution Result",
      description: "Result from DescribeExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          executionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the execution.",
          },
          stateMachineArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the executed stated machine.",
          },
          name: {
            type: "string",
            description: "The name of the execution.",
          },
          status: {
            type: "string",
            description: "The current status of the execution.",
          },
          startDate: {
            type: "string",
            description: "The date the execution is started.",
          },
          stopDate: {
            type: "string",
            description:
              "If the execution ended, the date the execution stopped.",
          },
          input: {
            type: "string",
            description:
              "The string that contains the JSON input data of the execution.",
          },
          inputDetails: {
            type: "object",
            properties: {
              included: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Provides details about execution input or output.",
          },
          output: {
            type: "string",
            description: "The JSON output data of the execution.",
          },
          outputDetails: {
            type: "object",
            properties: {
              included: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "Provides details about execution input or output.",
          },
          traceHeader: {
            type: "string",
            description:
              "The X-Ray trace header that was passed to the execution.",
          },
          mapRunArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies a Map Run, which dispatched this execution.",
          },
          error: {
            type: "string",
            description:
              "The error string if the state machine execution failed.",
          },
          cause: {
            type: "string",
            description:
              "The cause string if the state machine execution failed.",
          },
          stateMachineVersionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the state machine version associated with the execution.",
          },
          stateMachineAliasArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the state machine alias associated with the execution.",
          },
          redriveCount: {
            type: "number",
            description: "The number of times you've redriven an execution.",
          },
          redriveDate: {
            type: "string",
            description: "The date the execution was last redriven.",
          },
          redriveStatus: {
            type: "string",
            description:
              "Indicates whether or not an execution can be redriven at a given point in time.",
          },
          redriveStatusReason: {
            type: "string",
            description:
              "When redriveStatus is NOT_REDRIVABLE, redriveStatusReason specifies the reason why an execution cannot be redriven.",
          },
        },
        required: ["executionArn", "stateMachineArn", "status", "startDate"],
      },
    },
  },
};

export default describeExecution;
