import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateRealtimeLogConfigCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRealtimeLogConfig: AppBlock = {
  name: "Create Realtime Log Config",
  description: `Creates a real-time log configuration.`,
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
        EndPoints: {
          name: "End Points",
          description:
            "Contains information about the Amazon Kinesis data stream where you are sending real-time log data.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StreamType: {
                  type: "string",
                },
                KinesisStreamConfig: {
                  type: "object",
                  properties: {
                    RoleARN: {
                      type: "string",
                    },
                    StreamARN: {
                      type: "string",
                    },
                  },
                  required: ["RoleARN", "StreamARN"],
                  additionalProperties: false,
                },
              },
              required: ["StreamType"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        Fields: {
          name: "Fields",
          description:
            "A list of fields to include in each real-time log record.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        Name: {
          name: "Name",
          description:
            "A unique name to identify this real-time log configuration.",
          type: "string",
          required: true,
        },
        SamplingRate: {
          name: "Sampling Rate",
          description:
            "The sampling rate for this real-time log configuration.",
          type: "number",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateRealtimeLogConfigCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Realtime Log Config Result",
      description: "Result from CreateRealtimeLogConfig operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RealtimeLogConfig: {
            type: "object",
            properties: {
              ARN: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              SamplingRate: {
                type: "number",
              },
              EndPoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    StreamType: {
                      type: "string",
                    },
                    KinesisStreamConfig: {
                      type: "object",
                      properties: {
                        RoleARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StreamARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["RoleARN", "StreamARN"],
                      additionalProperties: false,
                    },
                  },
                  required: ["StreamType"],
                  additionalProperties: false,
                },
              },
              Fields: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["ARN", "Name", "SamplingRate", "EndPoints", "Fields"],
            additionalProperties: false,
            description: "A real-time log configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRealtimeLogConfig;
