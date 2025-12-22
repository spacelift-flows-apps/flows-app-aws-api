import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, ModifyDBProxyCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBProxy: AppBlock = {
  name: "Modify DB Proxy",
  description: `Changes the settings for an existing DB proxy.`,
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
        DBProxyName: {
          name: "DB Proxy Name",
          description: "The identifier for the DBProxy to modify.",
          type: "string",
          required: true,
        },
        NewDBProxyName: {
          name: "New DB Proxy Name",
          description: "The new identifier for the DBProxy.",
          type: "string",
          required: false,
        },
        Auth: {
          name: "Auth",
          description: "The new authentication settings for the DBProxy.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Description: {
                  type: "string",
                },
                UserName: {
                  type: "string",
                },
                AuthScheme: {
                  type: "string",
                },
                SecretArn: {
                  type: "string",
                },
                IAMAuth: {
                  type: "string",
                },
                ClientPasswordAuthType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        RequireTLS: {
          name: "Require TLS",
          description:
            "Whether Transport Layer Security (TLS) encryption is required for connections to the proxy.",
          type: "boolean",
          required: false,
        },
        IdleClientTimeout: {
          name: "Idle Client Timeout",
          description:
            "The number of seconds that a connection to the proxy can be inactive before the proxy disconnects it.",
          type: "number",
          required: false,
        },
        DebugLogging: {
          name: "Debug Logging",
          description:
            "Whether the proxy includes detailed information about SQL statements in its logs.",
          type: "boolean",
          required: false,
        },
        RoleArn: {
          name: "Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role that the proxy uses to access secrets in Amazon Web Services Secrets Manager.",
          type: "string",
          required: false,
        },
        SecurityGroups: {
          name: "Security Groups",
          description: "The new list of security groups for the DBProxy.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyDBProxyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Proxy Result",
      description: "Result from ModifyDBProxy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBProxy: {
            type: "object",
            properties: {
              DBProxyName: {
                type: "string",
              },
              DBProxyArn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              EngineFamily: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              VpcSecurityGroupIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              VpcSubnetIds: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              Auth: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Description: {
                      type: "string",
                    },
                    UserName: {
                      type: "string",
                    },
                    AuthScheme: {
                      type: "string",
                    },
                    SecretArn: {
                      type: "string",
                    },
                    IAMAuth: {
                      type: "string",
                    },
                    ClientPasswordAuthType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              RoleArn: {
                type: "string",
              },
              Endpoint: {
                type: "string",
              },
              RequireTLS: {
                type: "boolean",
              },
              IdleClientTimeout: {
                type: "number",
              },
              DebugLogging: {
                type: "boolean",
              },
              CreatedDate: {
                type: "string",
              },
              UpdatedDate: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The DBProxy object representing the new settings for the proxy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyDBProxy;
