import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SNSClient,
  ListPlatformApplicationsCommand,
} from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listPlatformApplications: AppBlock = {
  name: "List Platform Applications",
  description: `Lists the platform application objects for the supported push notification services, such as APNS and GCM (Firebase Cloud Messaging).`,
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
            "NextToken string is used when calling ListPlatformApplications action to retrieve additional records that are available after the first page results.",
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

        const client = new SNSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListPlatformApplicationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Platform Applications Result",
      description: "Result from ListPlatformApplications operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PlatformApplications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PlatformApplicationArn: {
                  type: "string",
                },
                Attributes: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "Platform applications returned when calling ListPlatformApplications action.",
          },
          NextToken: {
            type: "string",
            description:
              "NextToken string is returned when calling ListPlatformApplications action if additional records are available after the first page results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listPlatformApplications;
