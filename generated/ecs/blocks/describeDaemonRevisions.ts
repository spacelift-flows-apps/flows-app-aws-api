import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DescribeDaemonRevisionsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDaemonRevisions: AppBlock = {
  name: "Describe Daemon Revisions",
  description: `Describes one or more of your daemon revisions.`,
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
        daemonRevisionArns: {
          name: "daemon Revision Arns",
          description: "The ARN of the daemon revisions to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDaemonRevisionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Daemon Revisions Result",
      description: "Result from DescribeDaemonRevisions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          daemonRevisions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                daemonRevisionArn: {
                  type: "string",
                },
                clusterArn: {
                  type: "string",
                },
                daemonArn: {
                  type: "string",
                },
                daemonTaskDefinitionArn: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                containerImages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      containerName: {
                        type: "string",
                      },
                      imageDigest: {
                        type: "string",
                      },
                      image: {
                        type: "string",
                      },
                    },
                    additionalProperties: false,
                  },
                },
                propagateTags: {
                  type: "string",
                  enum: ["DAEMON", "NONE"],
                },
                enableECSManagedTags: {
                  type: "boolean",
                },
                enableExecuteCommand: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description: "The list of daemon revisions.",
          },
          failures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                arn: {
                  type: "string",
                },
                reason: {
                  type: "string",
                },
                detail: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Any failures associated with the call.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDaemonRevisions;
