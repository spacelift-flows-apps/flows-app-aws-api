import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, ListVirtualMFADevicesCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listVirtualMFADevices: AppBlock = {
  name: "List Virtual MFA Devices",
  description: `Lists the virtual MFA devices defined in the Amazon Web Services account by assignment status.`,
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
        AssignmentStatus: {
          name: "Assignment Status",
          description:
            "The status (Unassigned or Assigned) of the devices to list.",
          type: "string",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this parameter only when paginating results and only after you receive a response indicating that the results are truncated.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "Use this only when paginating results to indicate the maximum number of items you want in the response.",
          type: "number",
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

        const command = new ListVirtualMFADevicesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Virtual MFA Devices Result",
      description: "Result from ListVirtualMFADevices operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VirtualMFADevices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SerialNumber: {
                  type: "string",
                },
                Base32StringSeed: {
                  type: "string",
                },
                QRCodePNG: {
                  type: "string",
                },
                User: {
                  type: "object",
                  properties: {
                    Path: {
                      type: "string",
                    },
                    UserName: {
                      type: "string",
                    },
                    UserId: {
                      type: "string",
                    },
                    Arn: {
                      type: "string",
                    },
                    CreateDate: {
                      type: "string",
                    },
                    PasswordLastUsed: {
                      type: "string",
                    },
                    PermissionsBoundary: {
                      type: "object",
                      properties: {
                        PermissionsBoundaryType: {
                          type: "object",
                          additionalProperties: true,
                        },
                        PermissionsBoundaryArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Tags: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["Path", "UserName", "UserId", "Arn", "CreateDate"],
                  additionalProperties: false,
                },
                EnableDate: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["SerialNumber"],
              additionalProperties: false,
            },
            description:
              "The list of virtual MFA devices in the current account that match the AssignmentStatus value that was passed in the request.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more items to return.",
          },
          Marker: {
            type: "string",
            description:
              "When IsTruncated is true, this element is present and contains the value to use for the Marker parameter in a subsequent pagination request.",
          },
        },
        required: ["VirtualMFADevices"],
      },
    },
  },
};

export default listVirtualMFADevices;
