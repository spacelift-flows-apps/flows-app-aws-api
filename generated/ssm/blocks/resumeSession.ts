import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ResumeSessionCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const resumeSession: AppBlock = {
  name: "Resume Session",
  description: `Reconnects a session to a managed node after it has been disconnected.`,
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
        SessionId: {
          name: "Session Id",
          description: "The ID of the disconnected session to resume.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ResumeSessionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Resume Session Result",
      description: "Result from ResumeSession operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SessionId: {
            type: "string",
            description: "The ID of the session.",
          },
          TokenValue: {
            type: "string",
            description:
              "An encrypted token value containing session and caller information.",
          },
          StreamUrl: {
            type: "string",
            description:
              "A URL back to SSM Agent on the managed node that the Session Manager client uses to send commands and receive output from the managed node.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default resumeSession;
