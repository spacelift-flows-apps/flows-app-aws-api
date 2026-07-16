import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, CreateDelegationRequestCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDelegationRequest: AppBlock = {
  name: "Create Delegation Request",
  description: `Creates an IAM delegation request for temporary access delegation.`,
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
        OwnerAccountId: {
          name: "Owner Account Id",
          description:
            "The Amazon Web Services account ID this delegation request is targeted to.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description of the delegation request.",
          type: "string",
          required: true,
        },
        Permissions: {
          name: "Permissions",
          description:
            "The permissions to be delegated in this delegation request.",
          type: {
            type: "object",
            properties: {
              PolicyTemplateArn: {
                type: "string",
              },
              Parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Values: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    Type: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        RequestMessage: {
          name: "Request Message",
          description:
            "A message explaining the reason for the delegation request.",
          type: "string",
          required: false,
        },
        RequestorWorkflowId: {
          name: "Requestor Workflow Id",
          description: "The workflow ID associated with the requestor.",
          type: "string",
          required: true,
        },
        RedirectUrl: {
          name: "Redirect Url",
          description:
            "The URL to redirect to after the delegation request is processed.",
          type: "string",
          required: false,
        },
        NotificationChannel: {
          name: "Notification Channel",
          description:
            "The notification channel for updates about the delegation request.",
          type: "string",
          required: true,
        },
        SessionDuration: {
          name: "Session Duration",
          description:
            "The duration for which the delegated session should remain active, in seconds.",
          type: "number",
          required: true,
        },
        OnlySendByOwner: {
          name: "Only Send By Owner",
          description:
            "Specifies whether the delegation token should only be sent by the owner.",
          type: "boolean",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateDelegationRequestCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Delegation Request Result",
      description: "Result from CreateDelegationRequest operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ConsoleDeepLink: {
            type: "string",
            description:
              "A deep link URL to the Amazon Web Services Management Console for managing the delegation request.",
          },
          DelegationRequestId: {
            type: "string",
            description:
              "The unique identifier for the created delegation request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDelegationRequest;
