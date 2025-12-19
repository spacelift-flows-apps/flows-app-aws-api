import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  DescribeEndpointCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEndpoint: AppBlock = {
  name: "Describe Endpoint",
  description: `Get the information about an existing global endpoint.`,
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
          description:
            "The name of the endpoint you want to get information about.",
          type: "string",
          required: true,
        },
        HomeRegion: {
          name: "Home Region",
          description:
            "The primary Region of the endpoint you want to get information about.",
          type: "string",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Endpoint Result",
      description: "Result from DescribeEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Name: {
            type: "string",
            description:
              "The name of the endpoint you asked for information about.",
          },
          Description: {
            type: "string",
            description:
              "The description of the endpoint you asked for information about.",
          },
          Arn: {
            type: "string",
            description:
              "The ARN of the endpoint you asked for information about.",
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
            description:
              "The routing configuration of the endpoint you asked for information about.",
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
              "Whether replication is enabled or disabled for the endpoint you asked for information about.",
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
            description:
              "The event buses being used by the endpoint you asked for information about.",
          },
          RoleArn: {
            type: "string",
            description:
              "The ARN of the role used by the endpoint you asked for information about.",
          },
          EndpointId: {
            type: "string",
            description:
              "The ID of the endpoint you asked for information about.",
          },
          EndpointUrl: {
            type: "string",
            description:
              "The URL of the endpoint you asked for information about.",
          },
          State: {
            type: "string",
            description:
              "The current state of the endpoint you asked for information about.",
          },
          StateReason: {
            type: "string",
            description:
              "The reason the endpoint you asked for information about is in its current state.",
          },
          CreationTime: {
            type: "string",
            description:
              "The time the endpoint you asked for information about was created.",
          },
          LastModifiedTime: {
            type: "string",
            description:
              "The last time the endpoint you asked for information about was modified.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEndpoint;
