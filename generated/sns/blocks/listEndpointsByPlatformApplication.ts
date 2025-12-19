import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SNSClient,
  ListEndpointsByPlatformApplicationCommand,
} from "@aws-sdk/client-sns";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listEndpointsByPlatformApplication: AppBlock = {
  name: "List Endpoints By Platform Application",
  description: `Lists the endpoints and endpoint attributes for devices in a supported push notification service, such as GCM (Firebase Cloud Messaging) and APNS.`,
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
        PlatformApplicationArn: {
          name: "Platform Application Arn",
          description:
            "PlatformApplicationArn for ListEndpointsByPlatformApplicationInput action.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "NextToken string is used when calling ListEndpointsByPlatformApplication action to retrieve additional records that are available after the first page results.",
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

        const command = new ListEndpointsByPlatformApplicationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Endpoints By Platform Application Result",
      description: "Result from ListEndpointsByPlatformApplication operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Endpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                EndpointArn: {
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
              "Endpoints returned for ListEndpointsByPlatformApplication action.",
          },
          NextToken: {
            type: "string",
            description:
              "NextToken string is returned when calling ListEndpointsByPlatformApplication action if additional records are available after the first page results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listEndpointsByPlatformApplication;
