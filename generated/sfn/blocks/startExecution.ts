import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startExecution: AppBlock = {
  name: "Start Execution",
  description: `Starts a state machine execution.`,
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
        stateMachineArn: {
          name: "state Machine Arn",
          description:
            "The Amazon Resource Name (ARN) of the state machine to execute.",
          type: "string",
          required: true,
        },
        name: {
          name: "name",
          description: "Optional name of the execution.",
          type: "string",
          required: false,
        },
        input: {
          name: "input",
          description:
            'The string that contains the JSON input data for the execution, for example: "{\\"first_name\\" : \\"Alejandro\\"}" If you don\'t include any JSON input data, you still must include the two braces, for example: "{}" Length constraints apply to the payload size, and are expressed as bytes in UTF-8 encoding.',
          type: "string",
          required: false,
        },
        traceHeader: {
          name: "trace Header",
          description: "Passes the X-Ray trace header.",
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

        const command = new StartExecutionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Execution Result",
      description: "Result from StartExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          executionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the execution.",
          },
          startDate: {
            type: "string",
            description: "The date the execution is started.",
          },
        },
        required: ["executionArn", "startDate"],
      },
    },
  },
};

export default startExecution;
