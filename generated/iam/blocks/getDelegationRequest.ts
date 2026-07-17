import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, GetDelegationRequestCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDelegationRequest: AppBlock = {
  name: "Get Delegation Request",
  description: `Retrieves information about a specific delegation request.`,
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
        DelegationRequestId: {
          name: "Delegation Request Id",
          description:
            "The unique identifier of the delegation request to retrieve.",
          type: "string",
          required: true,
        },
        DelegationPermissionCheck: {
          name: "Delegation Permission Check",
          description:
            "Specifies whether to perform a permission check for the delegation request.",
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

        const command = new GetDelegationRequestCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Delegation Request Result",
      description: "Result from GetDelegationRequest operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DelegationRequest: {
            type: "object",
            properties: {
              DelegationRequestId: {
                type: "string",
              },
              OwnerAccountId: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              RequestMessage: {
                type: "string",
              },
              Permissions: {
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
                          items: {},
                        },
                        Type: {
                          type: "string",
                          enum: ["string", "stringList"],
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                additionalProperties: false,
              },
              PermissionPolicy: {
                type: "string",
              },
              RolePermissionRestrictionArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              OwnerId: {
                type: "string",
              },
              ApproverId: {
                type: "string",
              },
              State: {
                type: "string",
                enum: [
                  "UNASSIGNED",
                  "ASSIGNED",
                  "PENDING_APPROVAL",
                  "FINALIZED",
                  "ACCEPTED",
                  "REJECTED",
                  "EXPIRED",
                ],
              },
              ExpirationTime: {
                type: "string",
              },
              RequestorId: {
                type: "string",
              },
              RequestorName: {
                type: "string",
              },
              CreateDate: {
                type: "string",
              },
              SessionDuration: {
                type: "number",
              },
              RedirectUrl: {
                type: "string",
              },
              Notes: {
                type: "string",
              },
              RejectionReason: {
                type: "string",
              },
              OnlySendByOwner: {
                type: "boolean",
              },
              UpdatedTime: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The delegation request object containing all details about the request.",
          },
          PermissionCheckStatus: {
            type: "string",
            enum: ["COMPLETE", "IN_PROGRESS", "FAILED"],
            description:
              "The status of the permission check for the delegation request.",
          },
          PermissionCheckResult: {
            type: "string",
            enum: ["ALLOWED", "DENIED", "UNSURE"],
            description:
              "The result of the permission check, indicating whether the caller has sufficient permissions to cover the requested permissions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDelegationRequest;
