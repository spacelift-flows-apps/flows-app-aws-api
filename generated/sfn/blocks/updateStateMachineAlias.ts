import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, UpdateStateMachineAliasCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateStateMachineAlias: AppBlock = {
  name: "Update State Machine Alias",
  description: `Updates the configuration of an existing state machine alias by modifying its description or routingConfiguration.`,
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
        stateMachineAliasArn: {
          name: "state Machine Alias Arn",
          description:
            "The Amazon Resource Name (ARN) of the state machine alias.",
          type: "string",
          required: true,
        },
        description: {
          name: "description",
          description: "A description of the state machine alias.",
          type: "string",
          required: false,
        },
        routingConfiguration: {
          name: "routing Configuration",
          description: "The routing configuration of the state machine alias.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stateMachineVersionArn: {
                  type: "string",
                },
                weight: {
                  type: "number",
                },
              },
              required: ["stateMachineVersionArn", "weight"],
              additionalProperties: false,
            },
          },
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

        const command = new UpdateStateMachineAliasCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update State Machine Alias Result",
      description: "Result from UpdateStateMachineAlias operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          updateDate: {
            type: "string",
            description:
              "The date and time the state machine alias was updated.",
          },
        },
        required: ["updateDate"],
      },
    },
  },
};

export default updateStateMachineAlias;
