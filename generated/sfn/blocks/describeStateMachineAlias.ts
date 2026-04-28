import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SFNClient,
  DescribeStateMachineAliasCommand,
} from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStateMachineAlias: AppBlock = {
  name: "Describe State Machine Alias",
  description: `Returns details about a state machine alias.`,
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

        const command = new DescribeStateMachineAliasCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe State Machine Alias Result",
      description: "Result from DescribeStateMachineAlias operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stateMachineAliasArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the state machine alias.",
          },
          name: {
            type: "string",
            description: "The name of the state machine alias.",
          },
          description: {
            type: "string",
            description: "A description of the alias.",
          },
          routingConfiguration: {
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
            description: "The routing configuration of the alias.",
          },
          creationDate: {
            type: "string",
            description: "The date the state machine alias was created.",
          },
          updateDate: {
            type: "string",
            description: "The date the state machine alias was last updated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStateMachineAlias;
