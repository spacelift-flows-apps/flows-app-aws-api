import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  ListCustomVerificationEmailTemplatesCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCustomVerificationEmailTemplates: AppBlock = {
  name: "List Custom Verification Email Templates",
  description: `Lists the existing custom verification email templates for your account in the current Amazon Web Services Region.`,
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
        NextToken: {
          name: "Next Token",
          description:
            "An array the contains the name and creation time stamp for each template in your Amazon SES account.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of custom verification email templates to return.",
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListCustomVerificationEmailTemplatesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Custom Verification Email Templates Result",
      description: "Result from ListCustomVerificationEmailTemplates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CustomVerificationEmailTemplates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TemplateName: {
                  type: "string",
                },
                FromEmailAddress: {
                  type: "string",
                },
                TemplateSubject: {
                  type: "string",
                },
                SuccessRedirectionURL: {
                  type: "string",
                },
                FailureRedirectionURL: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of the custom verification email templates that exist in your account.",
          },
          NextToken: {
            type: "string",
            description:
              "A token indicating that there are additional custom verification email templates available to be listed.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listCustomVerificationEmailTemplates;
