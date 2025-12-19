import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, DeleteFargateProfileCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteFargateProfile: AppBlock = {
  name: "Delete Fargate Profile",
  description: `Deletes an Fargate profile.`,
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
        clusterName: {
          name: "cluster Name",
          description: "The name of your cluster.",
          type: "string",
          required: true,
        },
        fargateProfileName: {
          name: "fargate Profile Name",
          description: "The name of the Fargate profile to delete.",
          type: "string",
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
        if (assumeRoleArn) {
          // Use STS to assume the specified role
          const stsClient = new STSClient({
            region: region,
            credentials: {
              accessKeyId: input.app.config.accessKeyId,
              secretAccessKey: input.app.config.secretAccessKey,
              sessionToken: input.app.config.sessionToken,
            },
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteFargateProfileCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Fargate Profile Result",
      description: "Result from DeleteFargateProfile operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          fargateProfile: {
            type: "object",
            properties: {
              fargateProfileName: {
                type: "string",
              },
              fargateProfileArn: {
                type: "string",
              },
              clusterName: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              podExecutionRoleArn: {
                type: "string",
              },
              subnets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              selectors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    namespace: {
                      type: "string",
                    },
                    labels: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              status: {
                type: "string",
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              health: {
                type: "object",
                properties: {
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: {
                          type: "object",
                          additionalProperties: true,
                        },
                        message: {
                          type: "object",
                          additionalProperties: true,
                        },
                        resourceIds: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "The deleted Fargate profile.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteFargateProfile;
