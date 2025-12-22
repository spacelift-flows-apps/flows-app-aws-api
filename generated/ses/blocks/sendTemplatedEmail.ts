import { AppBlock, events } from "@slflows/sdk/v1";
import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendTemplatedEmail: AppBlock = {
  name: "Send Templated Email",
  description: `Composes an email message using an email template and immediately queues it for sending.`,
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
        Source: {
          name: "Source",
          description: "The email address that is sending the email.",
          type: "string",
          required: true,
        },
        Destination: {
          name: "Destination",
          description:
            "The destination for this email, composed of To:, CC:, and BCC: fields.",
          type: {
            type: "object",
            properties: {
              ToAddresses: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              CcAddresses: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              BccAddresses: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        ReplyToAddresses: {
          name: "Reply To Addresses",
          description: "The reply-to email address(es) for the message.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ReturnPath: {
          name: "Return Path",
          description:
            "The email address that bounces and complaints are forwarded to when feedback forwarding is enabled.",
          type: "string",
          required: false,
        },
        SourceArn: {
          name: "Source Arn",
          description: "This parameter is used only for sending authorization.",
          type: "string",
          required: false,
        },
        ReturnPathArn: {
          name: "Return Path Arn",
          description: "This parameter is used only for sending authorization.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags, in the form of name/value pairs, to apply to an email that you send using SendTemplatedEmail.",
          type: {
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
          required: false,
        },
        ConfigurationSetName: {
          name: "Configuration Set Name",
          description:
            "The name of the configuration set to use when you send an email using SendTemplatedEmail.",
          type: "string",
          required: false,
        },
        Template: {
          name: "Template",
          description: "The template to use when sending this email.",
          type: "string",
          required: true,
        },
        TemplateArn: {
          name: "Template Arn",
          description:
            "The ARN of the template to use when sending this email.",
          type: "string",
          required: false,
        },
        TemplateData: {
          name: "Template Data",
          description: "A list of replacement values to apply to the template.",
          type: "string",
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new SendTemplatedEmailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Templated Email Result",
      description: "Result from SendTemplatedEmail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MessageId: {
            type: "string",
            description:
              "The unique message identifier returned from the SendTemplatedEmail action.",
          },
        },
        required: ["MessageId"],
      },
    },
  },
};

export default sendTemplatedEmail;
