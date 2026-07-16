import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ListDaemonDeploymentsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listDaemonDeployments: AppBlock = {
  name: "List Daemon Deployments",
  description: `Returns a list of daemon deployments for a specified daemon.`,
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
        daemonArn: {
          name: "daemon Arn",
          description:
            "The Amazon Resource Name (ARN) of the daemon to list deployments for.",
          type: "string",
          required: true,
        },
        status: {
          name: "status",
          description:
            "An optional filter to narrow the ListDaemonDeployments results by deployment status.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        createdAt: {
          name: "created At",
          description:
            "An optional filter to narrow the ListDaemonDeployments results by creation time.",
          type: {
            type: "object",
            properties: {
              before: {
                type: "string",
              },
              after: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of daemon deployment results that ListDaemonDeployments returned in paginated output.",
          type: "number",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a ListDaemonDeployments request indicating that more results are available to fulfill the request and further calls will be needed.",
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

        const command = new ListDaemonDeploymentsCommand(
          convertTimestamps(commandInput, new Set(["before", "after"])) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Daemon Deployments Result",
      description: "Result from ListDaemonDeployments operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListDaemonDeployments request.",
          },
          daemonDeployments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                daemonDeploymentArn: {
                  type: "string",
                },
                daemonArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                status: {
                  type: "string",
                },
                statusReason: {
                  type: "string",
                },
                targetDaemonRevisionArn: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                startedAt: {
                  type: "string",
                },
                stoppedAt: {
                  type: "string",
                },
                finishedAt: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of daemon deployment summaries.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDaemonDeployments;
