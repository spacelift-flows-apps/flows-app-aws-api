import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, ListExecutionsCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listExecutions: AppBlock = {
  name: "List Executions",
  description: `Lists all executions of a state machine or a Map Run.`,
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
            "The Amazon Resource Name (ARN) of the state machine whose executions is listed.",
          type: "string",
          required: false,
        },
        statusFilter: {
          name: "status Filter",
          description:
            "If specified, only list the executions whose current execution status matches the given filter.",
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
        nextToken: {
          name: "next Token",
          description:
            "If nextToken is returned, there are more results available.",
          type: "string",
          required: false,
        },
        mapRunArn: {
          name: "map Run Arn",
          description:
            "The Amazon Resource Name (ARN) of the Map Run that started the child workflow executions.",
          type: "string",
          required: false,
        },
        redriveFilter: {
          name: "redrive Filter",
          description:
            "Sets a filter to list executions based on whether or not they have been redriven.",
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

        const command = new ListExecutionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Executions Result",
      description: "Result from ListExecutions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          executions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                executionArn: {
                  type: "string",
                },
                stateMachineArn: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                startDate: {
                  type: "string",
                },
                stopDate: {
                  type: "string",
                },
                mapRunArn: {
                  type: "string",
                },
                itemCount: {
                  type: "number",
                },
                stateMachineVersionArn: {
                  type: "string",
                },
                stateMachineAliasArn: {
                  type: "string",
                },
                redriveCount: {
                  type: "number",
                },
                redriveDate: {
                  type: "string",
                },
              },
              required: [
                "executionArn",
                "stateMachineArn",
                "name",
                "status",
                "startDate",
              ],
              additionalProperties: false,
            },
            description: "The list of matching executions.",
          },
          nextToken: {
            type: "string",
            description:
              "If nextToken is returned, there are more results available.",
          },
        },
        required: ["executions"],
      },
    },
  },
};

export default listExecutions;
