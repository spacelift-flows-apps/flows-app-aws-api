import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  ListEndpointsCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listEndpoints: AppBlock = {
  name: "List Endpoints",
  description: `List the global endpoints associated with this account.`,
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
        NamePrefix: {
          name: "Name Prefix",
          description:
            "A value that will return a subset of the endpoints associated with this account.",
          type: "string",
          required: false,
        },
        HomeRegion: {
          name: "Home Region",
          description:
            "The primary Region of the endpoints associated with this account.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token returned by a previous call, which you can use to retrieve the next set of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of results returned by the call.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListEndpointsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Endpoints Result",
      description: "Result from ListEndpoints operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Endpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Arn: {
                  type: "string",
                },
                RoutingConfig: {
                  type: "object",
                  properties: {
                    FailoverConfig: {
                      type: "object",
                      properties: {
                        Primary: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Secondary: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Primary", "Secondary"],
                      additionalProperties: false,
                    },
                  },
                  required: ["FailoverConfig"],
                  additionalProperties: false,
                },
                ReplicationConfig: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                EventBuses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      EventBusArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["EventBusArn"],
                    additionalProperties: false,
                  },
                },
                RoleArn: {
                  type: "string",
                },
                EndpointId: {
                  type: "string",
                },
                EndpointUrl: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                StateReason: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                LastModifiedTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The endpoints returned by the call.",
          },
          NextToken: {
            type: "string",
            description: "A token indicating there are more results available.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listEndpoints;
