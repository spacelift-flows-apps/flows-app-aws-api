import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SFNClient,
  ValidateStateMachineDefinitionCommand,
} from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const validateStateMachineDefinition: AppBlock = {
  name: "Validate State Machine Definition",
  description: `Validates the syntax of a state machine definition specified in Amazon States Language (ASL), a JSON-based, structured language.`,
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
        definition: {
          name: "definition",
          description:
            "The Amazon States Language definition of the state machine.",
          type: "string",
          required: true,
        },
        type: {
          name: "type",
          description: "The target type of state machine for this definition.",
          type: "string",
          required: false,
        },
        severity: {
          name: "severity",
          description: "Minimum level of diagnostics to return.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of diagnostics that are returned per call.",
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

        const command = new ValidateStateMachineDefinitionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Validate State Machine Definition Result",
      description: "Result from ValidateStateMachineDefinition operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          result: {
            type: "string",
            description:
              "The result value will be OK when no syntax errors are found, or FAIL if the workflow definition does not pass verification.",
          },
          diagnostics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: {
                  type: "string",
                },
                code: {
                  type: "string",
                },
                message: {
                  type: "string",
                },
                location: {
                  type: "string",
                },
              },
              required: ["severity", "code", "message"],
              additionalProperties: false,
            },
            description:
              "An array of diagnostic errors and warnings found during validation of the state machine definition.",
          },
          truncated: {
            type: "boolean",
            description:
              "The result value will be true if the number of diagnostics found in the workflow definition exceeds maxResults.",
          },
        },
        required: ["result", "diagnostics"],
      },
    },
  },
};

export default validateStateMachineDefinition;
