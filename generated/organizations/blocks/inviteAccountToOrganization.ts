import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  InviteAccountToOrganizationCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const inviteAccountToOrganization: AppBlock = {
  name: "Invite Account To Organization",
  description: `Sends an invitation to another account to join your organization as a member account.`,
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
          description:
            "The identifier (ID) of the Amazon Web Services account that you want to invite to join your organization.",
          type: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Type: {
                type: "string",
              },
            },
            required: ["Id", "Type"],
            additionalProperties: false,
          },
          required: true,
        },
        Notes: {
          name: "Notes",
          description:
            "Additional information that you want to include in the generated email to the recipient account owner.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the account when it becomes a member of the organization.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new InviteAccountToOrganizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Invite Account To Organization Result",
      description: "Result from InviteAccountToOrganization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Handshake: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              Parties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Id: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                  },
                  required: ["Id", "Type"],
                  additionalProperties: false,
                },
              },
              State: {
                type: "string",
              },
              RequestedTimestamp: {
                type: "string",
              },
              ExpirationTimestamp: {
                type: "string",
              },
              Action: {
                type: "string",
              },
              Resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Value: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    Resources: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "A structure that contains details about the handshake that is created to support this invitation request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default inviteAccountToOrganization;
