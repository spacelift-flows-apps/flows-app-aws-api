import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBProxyCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBProxy: AppBlock = {
  name: "Create DB Proxy",
  description: `Creates a new DB proxy.`,
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
          description: "The identifier for the proxy.",
          type: "string",
          required: true,
        },
        EngineFamily: {
          name: "Engine Family",
          description: "The kinds of databases that the proxy can connect to.",
          type: "string",
          required: true,
        },
        Auth: {
          name: "Auth",
          description: "The authorization mechanism that the proxy uses.",
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
          required: true,
        },
        RoleArn: {
          name: "Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM role that the proxy uses to access secrets in Amazon Web Services Secrets Manager.",
          type: "string",
          required: true,
        },
        VpcSubnetIds: {
          name: "Vpc Subnet Ids",
          description:
            "One or more VPC subnet IDs to associate with the new proxy.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        VpcSecurityGroupIds: {
          name: "Vpc Security Group Ids",
          description:
            "One or more VPC security group IDs to associate with the new proxy.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RequireTLS: {
          name: "Require TLS",
          description:
            "Specifies whether Transport Layer Security (TLS) encryption is required for connections to the proxy.",
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
            "Specifies whether the proxy includes detailed information about SQL statements in its logs.",
          type: "boolean",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "An optional set of key-value pairs to associate arbitrary data of your choosing with the proxy.",
          type: {
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
        }

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateDBProxyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Proxy Result",
      description: "Result from CreateDBProxy operation",
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
              "The DBProxy structure corresponding to the new proxy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBProxy;
