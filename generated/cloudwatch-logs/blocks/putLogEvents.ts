import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putLogEvents: AppBlock = {
  name: "Put Log Events",
  description: `Uploads a batch of log events to the specified log stream.`,
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
        logGroupName: {
          name: "log Group Name",
          description: "The name of the log group.",
          type: "string",
          required: true,
        },
        logStreamName: {
          name: "log Stream Name",
          description: "The name of the log stream.",
          type: "string",
          required: true,
        },
        logEvents: {
          name: "log Events",
          description: "The log events.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: {
                  type: "number",
                },
                message: {
                  type: "string",
                },
              },
              required: ["timestamp", "message"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        sequenceToken: {
          name: "sequence Token",
          description:
            "The sequence token obtained from the response of the previous PutLogEvents call.",
          type: "string",
          required: false,
        },
        entity: {
          name: "entity",
          description: "The entity associated with the log events.",
          type: {
            type: "object",
            properties: {
              keyAttributes: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              attributes: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutLogEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Log Events Result",
      description: "Result from PutLogEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          nextSequenceToken: {
            type: "string",
            description: "The next sequence token.",
          },
          rejectedLogEventsInfo: {
            type: "object",
            properties: {
              tooNewLogEventStartIndex: {
                type: "number",
              },
              tooOldLogEventEndIndex: {
                type: "number",
              },
              expiredLogEventEndIndex: {
                type: "number",
              },
            },
            additionalProperties: false,
            description: "The rejected events.",
          },
          rejectedEntityInfo: {
            type: "object",
            properties: {
              errorType: {
                type: "string",
              },
            },
            required: ["errorType"],
            additionalProperties: false,
            description:
              "Information about why the entity is rejected when calling PutLogEvents.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putLogEvents;
