import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  StartCalculationExecutionCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startCalculationExecution: AppBlock = {
  name: "Start Calculation Execution",
  description: `Submits calculations for execution within a session.`,
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
        SessionId: {
          name: "Session Id",
          description: "The session ID.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description of the calculation.",
          type: "string",
          required: false,
        },
        CalculationConfiguration: {
          name: "Calculation Configuration",
          description:
            "Contains configuration information for the calculation.",
          type: {
            type: "object",
            properties: {
              CodeBlock: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        CodeBlock: {
          name: "Code Block",
          description: "A string that contains the code of the calculation.",
          type: "string",
          required: false,
        },
        ClientRequestToken: {
          name: "Client Request Token",
          description:
            "A unique case-sensitive string used to ensure the request to create the calculation is idempotent (executes only once).",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartCalculationExecutionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Calculation Execution Result",
      description: "Result from StartCalculationExecution operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CalculationExecutionId: {
            type: "string",
            description: "The calculation execution UUID.",
          },
          State: {
            type: "string",
            description:
              "CREATING - The calculation is in the process of being created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startCalculationExecution;
