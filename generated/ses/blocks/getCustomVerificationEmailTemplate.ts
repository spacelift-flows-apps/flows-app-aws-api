import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  GetCustomVerificationEmailTemplateCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCustomVerificationEmailTemplate: AppBlock = {
  name: "Get Custom Verification Email Template",
  description: `Returns the custom email verification template for the template name you specify.`,
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
            "The name of the custom verification email template to retrieve.",
          type: "string",
          required: true,
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

        const command = new GetCustomVerificationEmailTemplateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Custom Verification Email Template Result",
      description: "Result from GetCustomVerificationEmailTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TemplateName: {
            type: "string",
            description: "The name of the custom verification email template.",
          },
          FromEmailAddress: {
            type: "string",
            description:
              "The email address that the custom verification email is sent from.",
          },
          TemplateSubject: {
            type: "string",
            description: "The subject line of the custom verification email.",
          },
          TemplateContent: {
            type: "string",
            description: "The content of the custom verification email.",
          },
          SuccessRedirectionURL: {
            type: "string",
            description:
              "The URL that the recipient of the verification email is sent to if his or her address is successfully verified.",
          },
          FailureRedirectionURL: {
            type: "string",
            description:
              "The URL that the recipient of the verification email is sent to if his or her address is not successfully verified.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getCustomVerificationEmailTemplate;
