import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInstanceProfile: AppBlock = {
  name: "Get Instance Profile",
  description: `Retrieves information about the specified instance profile, including the instance profile's path, GUID, ARN, and role.`,
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
        InstanceProfileName: {
          name: "Instance Profile Name",
          description:
            "The name of the instance profile to get information about.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetInstanceProfileCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Instance Profile Result",
      description: "Result from GetInstanceProfile operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceProfile: {
            type: "object",
            properties: {
              Path: {
                type: "string",
              },
              InstanceProfileName: {
                type: "string",
              },
              InstanceProfileId: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              CreateDate: {
                type: "string",
              },
              Roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Path: {
                      type: "string",
                    },
                    RoleName: {
                      type: "string",
                    },
                    RoleId: {
                      type: "string",
                    },
                    Arn: {
                      type: "string",
                    },
                    CreateDate: {
                      type: "string",
                    },
                    AssumeRolePolicyDocument: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                    MaxSessionDuration: {
                      type: "number",
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
                    RoleLastUsed: {
                      type: "object",
                      properties: {
                        LastUsedDate: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Region: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Path", "RoleName", "RoleId", "Arn", "CreateDate"],
                  additionalProperties: false,
                },
              },
              Tags: {
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
            },
            required: [
              "Path",
              "InstanceProfileName",
              "InstanceProfileId",
              "Arn",
              "CreateDate",
              "Roles",
            ],
            additionalProperties: false,
            description:
              "A structure containing details about the instance profile.",
          },
        },
        required: ["InstanceProfile"],
      },
    },
  },
};

export default getInstanceProfile;
