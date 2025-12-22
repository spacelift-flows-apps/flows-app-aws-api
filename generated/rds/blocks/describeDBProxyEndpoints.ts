import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeDBProxyEndpointsCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBProxyEndpoints: AppBlock = {
  name: "Describe DB Proxy Endpoints",
  description: `Returns information about DB proxy endpoints.`,
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
            "The name of the DB proxy whose endpoints you want to describe.",
          type: "string",
          required: false,
        },
        DBProxyEndpointName: {
          name: "DB Proxy Endpoint Name",
          description: "The name of a DB proxy endpoint to describe.",
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

        const command = new DescribeDBProxyEndpointsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Proxy Endpoints Result",
      description: "Result from DescribeDBProxyEndpoints operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBProxyEndpoints: {
            type: "array",
            items: {
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
            },
            description:
              "The list of ProxyEndpoint objects returned by the API operation.",
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

export default describeDBProxyEndpoints;
