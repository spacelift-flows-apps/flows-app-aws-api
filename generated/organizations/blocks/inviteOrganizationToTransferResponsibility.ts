import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  InviteOrganizationToTransferResponsibilityCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const inviteOrganizationToTransferResponsibility: AppBlock = {
  name: "Invite Organization To Transfer Responsibility",
  description: `Sends an invitation to another organization's management account to designate your account with the specified responsibilities for their organization.`,
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
        Type: {
          name: "Type",
          description:
            "The type of responsibility you want to designate to your organization.",
          type: "string",
          required: true,
        },
        Target: {
          name: "Target",
          description: "A HandshakeParty object.",
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
            "Additional information that you want to include in the invitation.",
          type: "string",
          required: false,
        },
        StartTimestamp: {
          name: "Start Timestamp",
          description:
            "Timestamp when the recipient will begin managing the specified responsibilities.",
          type: "string",
          required: true,
        },
        SourceName: {
          name: "Source Name",
          description: "Name you want to assign to the transfer.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the transfer.",
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

        const command = new InviteOrganizationToTransferResponsibilityCommand(
          convertTimestamps(commandInput, new Set(["StartTimestamp"])) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Invite Organization To Transfer Responsibility Result",
      description:
        "Result from InviteOrganizationToTransferResponsibility operation",
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
            description: "Contains details for a handshake.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default inviteOrganizationToTransferResponsibility;
