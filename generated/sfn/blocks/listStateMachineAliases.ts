import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, ListStateMachineAliasesCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStateMachineAliases: AppBlock = {
  name: "List State Machine Aliases",
  description: `Lists aliases for a specified state machine ARN.`,
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
            "The Amazon Resource Name (ARN) of the state machine for which you want to list aliases.",
          type: "string",
          required: true,
        },
        nextToken: {
          name: "next Token",
          description:
            "If nextToken is returned, there are more results available.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of results that are returned per call.",
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

        const command = new ListStateMachineAliasesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List State Machine Aliases Result",
      description: "Result from ListStateMachineAliases operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stateMachineAliases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stateMachineAliasArn: {
                  type: "string",
                },
                creationDate: {
                  type: "string",
                },
              },
              required: ["stateMachineAliasArn", "creationDate"],
              additionalProperties: false,
            },
            description: "Aliases for the state machine.",
          },
          nextToken: {
            type: "string",
            description:
              "If nextToken is returned, there are more results available.",
          },
        },
        required: ["stateMachineAliases"],
      },
    },
  },
};

export default listStateMachineAliases;
