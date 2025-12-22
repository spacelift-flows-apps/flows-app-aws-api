import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  ModifyDBProxyTargetGroupCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyDBProxyTargetGroup: AppBlock = {
  name: "Modify DB Proxy Target Group",
  description: `Modifies the properties of a DBProxyTargetGroup.`,
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
        TargetGroupName: {
          name: "Target Group Name",
          description: "The name of the target group to modify.",
          type: "string",
          required: true,
        },
        DBProxyName: {
          name: "DB Proxy Name",
          description: "The name of the proxy.",
          type: "string",
          required: true,
        },
        ConnectionPoolConfig: {
          name: "Connection Pool Config",
          description:
            "The settings that determine the size and behavior of the connection pool for the target group.",
          type: {
            type: "object",
            properties: {
              MaxConnectionsPercent: {
                type: "number",
              },
              MaxIdleConnectionsPercent: {
                type: "number",
              },
              ConnectionBorrowTimeout: {
                type: "number",
              },
              SessionPinningFilters: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              InitQuery: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        NewName: {
          name: "New Name",
          description: "The new name for the modified DBProxyTarget.",
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

        const command = new ModifyDBProxyTargetGroupCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify DB Proxy Target Group Result",
      description: "Result from ModifyDBProxyTargetGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBProxyTargetGroup: {
            type: "object",
            properties: {
              DBProxyName: {
                type: "string",
              },
              TargetGroupName: {
                type: "string",
              },
              TargetGroupArn: {
                type: "string",
              },
              IsDefault: {
                type: "boolean",
              },
              Status: {
                type: "string",
              },
              ConnectionPoolConfig: {
                type: "object",
                properties: {
                  MaxConnectionsPercent: {
                    type: "number",
                  },
                  MaxIdleConnectionsPercent: {
                    type: "number",
                  },
                  ConnectionBorrowTimeout: {
                    type: "number",
                  },
                  SessionPinningFilters: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  InitQuery: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              CreatedDate: {
                type: "string",
              },
              UpdatedDate: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The settings of the modified DBProxyTarget.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyDBProxyTargetGroup;
