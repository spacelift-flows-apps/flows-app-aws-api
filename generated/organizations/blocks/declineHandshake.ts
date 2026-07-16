import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  DeclineHandshakeCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const declineHandshake: AppBlock = {
  name: "Decline Handshake",
  description: `Declines a Handshake.`,
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
        HandshakeId: {
          name: "Handshake Id",
          description: "ID for the handshake that you want to decline.",
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeclineHandshakeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Decline Handshake Result",
      description: "Result from DeclineHandshake operation",
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
                      enum: ["ACCOUNT", "ORGANIZATION", "EMAIL"],
                    },
                  },
                  required: ["Id", "Type"],
                  additionalProperties: false,
                },
              },
              State: {
                type: "string",
                enum: [
                  "REQUESTED",
                  "OPEN",
                  "CANCELED",
                  "ACCEPTED",
                  "DECLINED",
                  "EXPIRED",
                ],
              },
              RequestedTimestamp: {
                type: "string",
              },
              ExpirationTimestamp: {
                type: "string",
              },
              Action: {
                type: "string",
                enum: [
                  "INVITE",
                  "ENABLE_ALL_FEATURES",
                  "APPROVE_ALL_FEATURES",
                  "ADD_ORGANIZATIONS_SERVICE_LINKED_ROLE",
                  "TRANSFER_RESPONSIBILITY",
                ],
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
                      enum: [
                        "ACCOUNT",
                        "ORGANIZATION",
                        "ORGANIZATION_FEATURE_SET",
                        "EMAIL",
                        "MASTER_EMAIL",
                        "MASTER_NAME",
                        "NOTES",
                        "PARENT_HANDSHAKE",
                        "RESPONSIBILITY_TRANSFER",
                        "TRANSFER_START_TIMESTAMP",
                        "TRANSFER_TYPE",
                        "MANAGEMENT_ACCOUNT",
                        "MANAGEMENT_EMAIL",
                        "MANAGEMENT_NAME",
                      ],
                    },
                    Resources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Value: {},
                          Type: {},
                          Resources: {},
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "A Handshake object.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default declineHandshake;
