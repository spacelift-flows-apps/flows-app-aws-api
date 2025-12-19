import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, ListInstanceProfilesCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listInstanceProfiles: AppBlock = {
  name: "List Instance Profiles",
  description: `Lists the instance profiles that have the specified path prefix.`,
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
        PathPrefix: {
          name: "Path Prefix",
          description: "The path prefix for filtering the results.",
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

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListInstanceProfilesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Instance Profiles Result",
      description: "Result from ListInstanceProfiles operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceProfiles: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      RoleName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RoleId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Arn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CreateDate: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AssumeRolePolicyDocument: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Description: {
                        type: "object",
                        additionalProperties: true,
                      },
                      MaxSessionDuration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PermissionsBoundary: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Tags: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RoleLastUsed: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: [
                      "Path",
                      "RoleName",
                      "RoleId",
                      "Arn",
                      "CreateDate",
                    ],
                    additionalProperties: false,
                  },
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
              required: [
                "Path",
                "InstanceProfileName",
                "InstanceProfileId",
                "Arn",
                "CreateDate",
                "Roles",
              ],
              additionalProperties: false,
            },
            description: "A list of instance profiles.",
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
        required: ["InstanceProfiles"],
      },
    },
  },
};

export default listInstanceProfiles;
