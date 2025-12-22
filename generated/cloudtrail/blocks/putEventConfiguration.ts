import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  PutEventConfigurationCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putEventConfiguration: AppBlock = {
  name: "Put Event Configuration",
  description: `Updates the event configuration settings for the specified event data store.`,
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
        EventDataStore: {
          name: "Event Data Store",
          description:
            "The Amazon Resource Name (ARN) or ID suffix of the ARN of the event data store for which you want to update event configuration settings.",
          type: "string",
          required: false,
        },
        MaxEventSize: {
          name: "Max Event Size",
          description:
            "The maximum allowed size for events to be stored in the specified event data store.",
          type: "string",
          required: true,
        },
        ContextKeySelectors: {
          name: "Context Key Selectors",
          description:
            "A list of context key selectors that will be included to provide enriched event data.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                Equals: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Type", "Equals"],
              additionalProperties: false,
            },
          },
          required: true,
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutEventConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Event Configuration Result",
      description: "Result from PutEventConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventDataStoreArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) or ID suffix of the ARN of the event data store for which the event configuration settings were updated.",
          },
          MaxEventSize: {
            type: "string",
            description:
              "The maximum allowed size for events stored in the specified event data store.",
          },
          ContextKeySelectors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                Equals: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Type", "Equals"],
              additionalProperties: false,
            },
            description:
              "The list of context key selectors that are configured for the event data store.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putEventConfiguration;
