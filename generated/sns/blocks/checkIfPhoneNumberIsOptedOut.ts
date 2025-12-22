import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SNSClient,
  CheckIfPhoneNumberIsOptedOutCommand,
} from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const checkIfPhoneNumberIsOptedOut: AppBlock = {
  name: "Check If Phone Number Is Opted Out",
  description: `Accepts a phone number and indicates whether the phone holder has opted out of receiving SMS messages from your Amazon Web Services account.`,
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
        phoneNumber: {
          name: "phone Number",
          description:
            "The phone number for which you want to check the opt out status.",
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

        const client = new SNSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CheckIfPhoneNumberIsOptedOutCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Check If Phone Number Is Opted Out Result",
      description: "Result from CheckIfPhoneNumberIsOptedOut operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          isOptedOut: {
            type: "boolean",
            description:
              "Indicates whether the phone number is opted out: true – The phone number is opted out, meaning you cannot publish SMS messages to it.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default checkIfPhoneNumberIsOptedOut;
