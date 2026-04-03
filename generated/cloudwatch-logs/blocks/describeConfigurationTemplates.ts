import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  DescribeConfigurationTemplatesCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeConfigurationTemplates: AppBlock = {
  name: "Describe Configuration Templates",
  description: `Use this operation to return the valid and default values that are used when creating delivery sources, delivery destinations, and deliveries.`,
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
        service: {
          name: "service",
          description:
            "Use this parameter to filter the response to include only the configuration templates that apply to the Amazon Web Services service that you specify here.",
          type: "string",
          required: false,
        },
        logTypes: {
          name: "log Types",
          description:
            "Use this parameter to filter the response to include only the configuration templates that apply to the log types that you specify here.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        resourceTypes: {
          name: "resource Types",
          description:
            "Use this parameter to filter the response to include only the configuration templates that apply to the resource types that you specify here.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        deliveryDestinationTypes: {
          name: "delivery Destination Types",
          description:
            "Use this parameter to filter the response to include only the configuration templates that apply to the delivery destination types that you specify here.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        nextToken: {
          name: "next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        limit: {
          name: "limit",
          description:
            "Use this parameter to limit the number of configuration templates that are returned in the response.",
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeConfigurationTemplatesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Configuration Templates Result",
      description: "Result from DescribeConfigurationTemplates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          configurationTemplates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service: {
                  type: "string",
                },
                logType: {
                  type: "string",
                },
                resourceType: {
                  type: "string",
                },
                deliveryDestinationType: {
                  type: "string",
                },
                defaultDeliveryConfigValues: {
                  type: "object",
                  properties: {
                    recordFields: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    fieldDelimiter: {
                      type: "string",
                    },
                    s3DeliveryConfiguration: {
                      type: "object",
                      properties: {
                        suffixPath: {
                          type: "object",
                          additionalProperties: true,
                        },
                        enableHiveCompatiblePath: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                allowedFields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "object",
                        additionalProperties: true,
                      },
                      mandatory: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                allowedOutputFormats: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                allowedActionForAllowVendedLogsDeliveryForResource: {
                  type: "string",
                },
                allowedFieldDelimiters: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                allowedSuffixPathFields: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "An array of objects, where each object describes one configuration template that matches the filters that you specified in the request.",
          },
          nextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeConfigurationTemplates;
