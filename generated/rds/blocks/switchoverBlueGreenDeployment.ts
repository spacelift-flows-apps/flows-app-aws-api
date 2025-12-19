import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  SwitchoverBlueGreenDeploymentCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const switchoverBlueGreenDeployment: AppBlock = {
  name: "Switchover Blue Green Deployment",
  description: `Switches over a blue/green deployment.`,
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
        BlueGreenDeploymentIdentifier: {
          name: "Blue Green Deployment Identifier",
          description: "The resource ID of the blue/green deployment.",
          type: "string",
          required: true,
        },
        SwitchoverTimeout: {
          name: "Switchover Timeout",
          description:
            "The amount of time, in seconds, for the switchover to complete.",
          type: "number",
          required: false,
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SwitchoverBlueGreenDeploymentCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Switchover Blue Green Deployment Result",
      description: "Result from SwitchoverBlueGreenDeployment operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BlueGreenDeployment: {
            type: "object",
            properties: {
              BlueGreenDeploymentIdentifier: {
                type: "string",
              },
              BlueGreenDeploymentName: {
                type: "string",
              },
              Source: {
                type: "string",
              },
              Target: {
                type: "string",
              },
              SwitchoverDetails: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    SourceMember: {
                      type: "string",
                    },
                    TargetMember: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Status: {
                type: "string",
              },
              StatusDetails: {
                type: "string",
              },
              CreateTime: {
                type: "string",
              },
              DeleteTime: {
                type: "string",
              },
              TagList: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "Details about a blue/green deployment.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default switchoverBlueGreenDeployment;
