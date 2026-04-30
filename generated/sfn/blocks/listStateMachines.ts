import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, ListStateMachinesCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listStateMachines: AppBlock = {
  name: "List State Machines",
  description: `Lists the existing state machines.`,
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

        const command = new ListStateMachinesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List State Machines Result",
      description: "Result from ListStateMachines operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          stateMachines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stateMachineArn: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
                creationDate: {
                  type: "string",
                },
              },
              required: ["stateMachineArn", "name", "type", "creationDate"],
              additionalProperties: false,
            },
            description: "Parameter for the operation",
          },
          nextToken: {
            type: "string",
            description:
              "If nextToken is returned, there are more results available.",
          },
        },
        required: ["stateMachines"],
      },
    },
  },
};

export default listStateMachines;
