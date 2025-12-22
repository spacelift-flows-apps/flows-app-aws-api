import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  PutPermissionCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putPermission: AppBlock = {
  name: "Put Permission",
  description: `Running PutPermission permits the specified Amazon Web Services account or Amazon Web Services organization to put events to the specified event bus.`,
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
        EventBusName: {
          name: "Event Bus Name",
          description: "The name of the event bus associated with the rule.",
          type: "string",
          required: false,
        },
        Action: {
          name: "Action",
          description:
            "The action that you are enabling the other account to perform.",
          type: "string",
          required: false,
        },
        Principal: {
          name: "Principal",
          description:
            "The 12-digit Amazon Web Services account ID that you are permitting to put events to your default event bus.",
          type: "string",
          required: false,
        },
        StatementId: {
          name: "Statement Id",
          description:
            "An identifier string for the external account that you are granting permissions to.",
          type: "string",
          required: false,
        },
        Condition: {
          name: "Condition",
          description:
            "This parameter enables you to limit the permission to accounts that fulfill a certain condition, such as being a member of a certain Amazon Web Services organization.",
          type: {
            type: "object",
            properties: {
              Type: {
                type: "string",
              },
              Key: {
                type: "string",
              },
              Value: {
                type: "string",
              },
            },
            required: ["Type", "Key", "Value"],
            additionalProperties: false,
          },
          required: false,
        },
        Policy: {
          name: "Policy",
          description:
            "A JSON string that describes the permission policy statement.",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutPermissionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Permission Result",
      description: "Result from PutPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putPermission;
