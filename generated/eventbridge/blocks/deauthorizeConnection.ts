import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  DeauthorizeConnectionCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deauthorizeConnection: AppBlock = {
  name: "Deauthorize Connection",
  description: `Removes all authorization parameters from the connection.`,
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
        Name: {
          name: "Name",
          description:
            "The name of the connection to remove authorization from.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeauthorizeConnectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Deauthorize Connection Result",
      description: "Result from DeauthorizeConnection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConnectionArn: {
            type: "string",
            description:
              "The ARN of the connection that authorization was removed from.",
          },
          ConnectionState: {
            type: "string",
            description: "The state of the connection.",
          },
          CreationTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was created.",
          },
          LastModifiedTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was last updated.",
          },
          LastAuthorizedTime: {
            type: "string",
            description:
              "A time stamp for the time that the connection was last authorized.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deauthorizeConnection;
