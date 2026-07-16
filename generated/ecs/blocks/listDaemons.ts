import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ListDaemonsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDaemons: AppBlock = {
  name: "List Daemons",
  description: `Returns a list of daemons.`,
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
        clusterArn: {
          name: "cluster Arn",
          description:
            "The Amazon Resource Name (ARN) of the cluster to filter daemons by.",
          type: "string",
          required: false,
        },
        capacityProviderArns: {
          name: "capacity Provider Arns",
          description:
            "The Amazon Resource Names (ARNs) of the capacity providers to filter daemons by.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of daemon results that ListDaemons returned in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a ListDaemons request indicating that more results are available to fulfill the request and further calls will be needed.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListDaemonsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Daemons Result",
      description: "Result from ListDaemons operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          daemonSummariesList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                daemonArn: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                updatedAt: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of daemon summaries.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListDaemons request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDaemons;
