import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  CreateEndpointCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createEndpoint: AppBlock = {
  name: "Create Endpoint",
  description: `Creates a global endpoint.`,
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
        Name: {
          name: "Name",
          description: "The name of the global endpoint.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description of the global endpoint.",
          type: "string",
          required: false,
        },
        RoutingConfig: {
          name: "Routing Config",
          description:
            "Configure the routing policy, including the health check and secondary Region.",
          type: {
            type: "object",
            properties: {
              FailoverConfig: {
                type: "object",
                properties: {
                  Primary: {
                    type: "object",
                    properties: {
                      HealthCheck: {
                        type: "string",
                      },
                    },
                    required: ["HealthCheck"],
                    additionalProperties: false,
                  },
                  Secondary: {
                    type: "object",
                    properties: {
                      Route: {
                        type: "string",
                      },
                    },
                    required: ["Route"],
                    additionalProperties: false,
                  },
                },
                required: ["Primary", "Secondary"],
                additionalProperties: false,
              },
            },
            required: ["FailoverConfig"],
            additionalProperties: false,
          },
          required: true,
        },
        ReplicationConfig: {
          name: "Replication Config",
          description: "Enable or disable event replication.",
          type: {
            type: "object",
            properties: {
              State: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        EventBuses: {
          name: "Event Buses",
          description: "Define the event buses used.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventBusArn: {
                  type: "string",
                },
              },
              required: ["EventBusArn"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        RoleArn: {
          name: "Role Arn",
          description: "The ARN of the role used for replication.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Endpoint Result",
      description: "Result from CreateEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description:
              "The name of the endpoint that was created by this request.",
          },
          Arn: {
            type: "string",
            description:
              "The ARN of the endpoint that was created by this request.",
          },
          RoutingConfig: {
            type: "object",
            properties: {
              FailoverConfig: {
                type: "object",
                properties: {
                  Primary: {
                    type: "object",
                    properties: {
                      HealthCheck: {
                        type: "string",
                      },
                    },
                    required: ["HealthCheck"],
                    additionalProperties: false,
                  },
                  Secondary: {
                    type: "object",
                    properties: {
                      Route: {
                        type: "string",
                      },
                    },
                    required: ["Route"],
                    additionalProperties: false,
                  },
                },
                required: ["Primary", "Secondary"],
                additionalProperties: false,
              },
            },
            required: ["FailoverConfig"],
            additionalProperties: false,
            description: "The routing configuration defined by this request.",
          },
          ReplicationConfig: {
            type: "object",
            properties: {
              State: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Whether event replication was enabled or disabled by this request.",
          },
          EventBuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EventBusArn: {
                  type: "string",
                },
              },
              required: ["EventBusArn"],
              additionalProperties: false,
            },
            description: "The event buses used by this request.",
          },
          RoleArn: {
            type: "string",
            description:
              "The ARN of the role used by event replication for this request.",
          },
          State: {
            type: "string",
            description:
              "The state of the endpoint that was created by this request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createEndpoint;
