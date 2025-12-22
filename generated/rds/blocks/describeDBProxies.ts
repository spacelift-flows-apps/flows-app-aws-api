import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBProxiesCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBProxies: AppBlock = {
  name: "Describe DB Proxies",
  description: `Returns information about DB proxies.`,
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
          description: "The name of the DB proxy.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter is not currently supported.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous request.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
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

        const command = new DescribeDBProxiesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Proxies Result",
      description: "Result from DescribeDBProxies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBProxies: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      UserName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthScheme: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SecretArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IAMAuth: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ClientPasswordAuthType: {
                        type: "object",
                        additionalProperties: true,
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
            },
            description:
              "A return value representing an arbitrary number of DBProxy data structures.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBProxies;
