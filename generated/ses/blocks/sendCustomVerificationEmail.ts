import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  SendCustomVerificationEmailCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sendCustomVerificationEmail: AppBlock = {
  name: "Send Custom Verification Email",
  description: `Adds an email address to the list of identities for your Amazon SES account in the current Amazon Web Services Region and attempts to verify it.`,
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
        EmailAddress: {
          name: "Email Address",
          description: "The email address to verify.",
          type: "string",
          required: true,
        },
        TemplateName: {
          name: "Template Name",
          description:
            "The name of the custom verification email template to use when sending the verification email.",
          type: "string",
          required: true,
        },
        ConfigurationSetName: {
          name: "Configuration Set Name",
          description:
            "Name of a configuration set to use when sending the verification email.",
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

        const command = new SendCustomVerificationEmailCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Send Custom Verification Email Result",
      description: "Result from SendCustomVerificationEmail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          MessageId: {
            type: "string",
            description:
              "The unique message identifier returned from the SendCustomVerificationEmail operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default sendCustomVerificationEmail;
