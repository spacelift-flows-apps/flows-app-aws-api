import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, StartSessionCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startSession: AppBlock = {
  name: "Start Session",
  description: `Initiates a connection to a target (for example, a managed node) for a Session Manager session.`,
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
        Target: {
          name: "Target",
          description: "The managed node to connect to for the session.",
          type: "string",
          required: true,
        },
        DocumentName: {
          name: "Document Name",
          description:
            "The name of the SSM document you want to use to define the type of session, input parameters, or preferences for the session.",
          type: "string",
          required: false,
        },
        Reason: {
          name: "Reason",
          description: "The reason for connecting to the instance.",
          type: "string",
          required: false,
        },
        Parameters: {
          name: "Parameters",
          description:
            "The values you want to specify for the parameters defined in the Session document.",
          type: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
          },
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartSessionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Session Result",
      description: "Result from StartSession operation",
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
              "A URL back to SSM Agent on the managed node that the Session Manager client uses to send commands and receive output from the node.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startSession;
