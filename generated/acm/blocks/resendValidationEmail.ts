import { AppBlock, events } from "@slflows/sdk/v1";
import { ACMClient, ResendValidationEmailCommand } from "@aws-sdk/client-acm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const resendValidationEmail: AppBlock = {
  name: "Resend Validation Email",
  description: `Resends the email that requests domain ownership validation.`,
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
        CertificateArn: {
          name: "Certificate Arn",
          description:
            "String that contains the ARN of the requested certificate.",
          type: "string",
          required: true,
        },
        Domain: {
          name: "Domain",
          description:
            "The fully qualified domain name (FQDN) of the certificate that needs to be validated.",
          type: "string",
          required: true,
        },
        ValidationDomain: {
          name: "Validation Domain",
          description:
            "The base validation domain that will act as the suffix of the email addresses that are used to send the emails.",
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

        const client = new ACMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ResendValidationEmailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Resend Validation Email Result",
      description: "Result from ResendValidationEmail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default resendValidationEmail;
