import { AppBlock, events } from "@slflows/sdk/v1";
import { SESClient, SendBounceCommand } from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendBounce: AppBlock = {
  name: "Send Bounce",
  description: `Generates and sends a bounce message to the sender of an email you received through Amazon SES.`,
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
        OriginalMessageId: {
          name: "Original Message Id",
          description: "The message ID of the message to be bounced.",
          type: "string",
          required: true,
        },
        BounceSender: {
          name: "Bounce Sender",
          description:
            'The address to use in the "From" header of the bounce message.',
          type: "string",
          required: true,
        },
        Explanation: {
          name: "Explanation",
          description:
            "Human-readable text for the bounce message to explain the failure.",
          type: "string",
          required: false,
        },
        MessageDsn: {
          name: "Message Dsn",
          description: "Message-related DSN fields.",
          type: {
            type: "object",
            properties: {
              ReportingMta: {
                type: "string",
              },
              ArrivalDate: {
                type: "string",
              },
              ExtensionFields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Name", "Value"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ReportingMta"],
            additionalProperties: false,
          },
          required: false,
        },
        BouncedRecipientInfoList: {
          name: "Bounced Recipient Info List",
          description:
            "A list of recipients of the bounced message, including the information required to create the Delivery Status Notifications (DSNs) for the recipients.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Recipient: {
                  type: "string",
                },
                RecipientArn: {
                  type: "string",
                },
                BounceType: {
                  type: "string",
                },
                RecipientDsnFields: {
                  type: "object",
                  properties: {
                    FinalRecipient: {
                      type: "string",
                    },
                    Action: {
                      type: "string",
                    },
                    RemoteMta: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    DiagnosticCode: {
                      type: "string",
                    },
                    LastAttemptDate: {
                      type: "string",
                    },
                    ExtensionFields: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["Action", "Status"],
                  additionalProperties: false,
                },
              },
              required: ["Recipient"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        BounceSenderArn: {
          name: "Bounce Sender Arn",
          description: "This parameter is used only for sending authorization.",
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SendBounceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Bounce Result",
      description: "Result from SendBounce operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MessageId: {
            type: "string",
            description: "The message ID of the bounce message.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default sendBounce;
