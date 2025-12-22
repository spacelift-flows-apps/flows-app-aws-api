import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBProxyEndpointCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBProxyEndpoint: AppBlock = {
  name: "Create DB Proxy Endpoint",
  description: `Creates a DBProxyEndpoint.`,
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
          description:
            "The name of the DB proxy associated with the DB proxy endpoint that you create.",
          type: "string",
          required: true,
        },
        DBProxyEndpointName: {
          name: "DB Proxy Endpoint Name",
          description: "The name of the DB proxy endpoint to create.",
          type: "string",
          required: true,
        },
        VpcSubnetIds: {
          name: "Vpc Subnet Ids",
          description:
            "The VPC subnet IDs for the DB proxy endpoint that you create.",
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
            "The VPC security group IDs for the DB proxy endpoint that you create.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        TargetRole: {
          name: "Target Role",
          description: "The role of the DB proxy endpoint.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
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

        const command = new CreateDBProxyEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Proxy Endpoint Result",
      description: "Result from CreateDBProxyEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBProxyEndpoint: {
            type: "object",
            properties: {
              DBProxyEndpointName: {
                type: "string",
              },
              DBProxyEndpointArn: {
                type: "string",
              },
              DBProxyName: {
                type: "string",
              },
              Status: {
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
              Endpoint: {
                type: "string",
              },
              CreatedDate: {
                type: "string",
              },
              TargetRole: {
                type: "string",
              },
              IsDefault: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description:
              "The DBProxyEndpoint object that is created by the API operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBProxyEndpoint;
