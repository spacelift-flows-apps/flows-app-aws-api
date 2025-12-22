import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  UpdateCustomVerificationEmailTemplateCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCustomVerificationEmailTemplate: AppBlock = {
  name: "Update Custom Verification Email Template",
  description: `Updates an existing custom verification email template.`,
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
        TemplateName: {
          name: "Template Name",
          description:
            "The name of the custom verification email template to update.",
          type: "string",
          required: true,
        },
        FromEmailAddress: {
          name: "From Email Address",
          description:
            "The email address that the custom verification email is sent from.",
          type: "string",
          required: false,
        },
        TemplateSubject: {
          name: "Template Subject",
          description: "The subject line of the custom verification email.",
          type: "string",
          required: false,
        },
        TemplateContent: {
          name: "Template Content",
          description: "The content of the custom verification email.",
          type: "string",
          required: false,
        },
        SuccessRedirectionURL: {
          name: "Success Redirection URL",
          description:
            "The URL that the recipient of the verification email is sent to if his or her address is successfully verified.",
          type: "string",
          required: false,
        },
        FailureRedirectionURL: {
          name: "Failure Redirection URL",
          description:
            "The URL that the recipient of the verification email is sent to if his or her address is not successfully verified.",
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateCustomVerificationEmailTemplateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Custom Verification Email Template Result",
      description:
        "Result from UpdateCustomVerificationEmailTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default updateCustomVerificationEmailTemplate;
