import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SNSClient,
  ListPhoneNumbersOptedOutCommand,
} from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listPhoneNumbersOptedOut: AppBlock = {
  name: "List Phone Numbers Opted Out",
  description: `Returns a list of phone numbers that are opted out, meaning you cannot send SMS messages to them.`,
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
        nextToken: {
          name: "next Token",
          description:
            "A NextToken string is used when you call the ListPhoneNumbersOptedOut action to retrieve additional records that are available after the first page of results.",
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

        const command = new ListPhoneNumbersOptedOutCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Phone Numbers Opted Out Result",
      description: "Result from ListPhoneNumbersOptedOut operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          phoneNumbers: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of phone numbers that are opted out of receiving SMS messages.",
          },
          nextToken: {
            type: "string",
            description:
              "A NextToken string is returned when you call the ListPhoneNumbersOptedOut action if additional records are available after the first page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listPhoneNumbersOptedOut;
