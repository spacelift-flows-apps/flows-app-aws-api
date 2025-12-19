import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  GetAccountAuthorizationDetailsCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAccountAuthorizationDetails: AppBlock = {
  name: "Get Account Authorization Details",
  description: `Retrieves information about all IAM users, groups, roles, and policies in your Amazon Web Services account, including their relationships to one another.`,
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
        Filter: {
          name: "Filter",
          description: "A list of entity types used to filter the results.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "Use this only when paginating results to indicate the maximum number of items you want in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this parameter only when paginating results and only after you receive a response indicating that the results are truncated.",
          type: "string",
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

        const command = new GetAccountAuthorizationDetailsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Account Authorization Details Result",
      description: "Result from GetAccountAuthorizationDetails operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          UserDetailList: {
            type: "array",
            items: {
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
                UserPolicyList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyDocument: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                GroupList: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AttachedManagedPolicies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                PermissionsBoundary: {
                  type: "object",
                  properties: {
                    PermissionsBoundaryType: {
                      type: "string",
                    },
                    PermissionsBoundaryArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
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
              additionalProperties: false,
            },
            description: "A list containing information about IAM users.",
          },
          GroupDetailList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Path: {
                  type: "string",
                },
                GroupName: {
                  type: "string",
                },
                GroupId: {
                  type: "string",
                },
                Arn: {
                  type: "string",
                },
                CreateDate: {
                  type: "string",
                },
                GroupPolicyList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyDocument: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                AttachedManagedPolicies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "A list containing information about IAM groups.",
          },
          RoleDetailList: {
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
                InstanceProfileList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Path: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceProfileName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceProfileId: {
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
                      Roles: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Tags: {
                        type: "object",
                        additionalProperties: true,
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
                },
                RolePolicyList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyDocument: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                AttachedManagedPolicies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                PermissionsBoundary: {
                  type: "object",
                  properties: {
                    PermissionsBoundaryType: {
                      type: "string",
                    },
                    PermissionsBoundaryArn: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
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
                RoleLastUsed: {
                  type: "object",
                  properties: {
                    LastUsedDate: {
                      type: "string",
                    },
                    Region: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "A list containing information about IAM roles.",
          },
          Policies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                PolicyName: {
                  type: "string",
                },
                PolicyId: {
                  type: "string",
                },
                Arn: {
                  type: "string",
                },
                Path: {
                  type: "string",
                },
                DefaultVersionId: {
                  type: "string",
                },
                AttachmentCount: {
                  type: "number",
                },
                PermissionsBoundaryUsageCount: {
                  type: "number",
                },
                IsAttachable: {
                  type: "boolean",
                },
                Description: {
                  type: "string",
                },
                CreateDate: {
                  type: "string",
                },
                UpdateDate: {
                  type: "string",
                },
                PolicyVersionList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Document: {
                        type: "object",
                        additionalProperties: true,
                      },
                      VersionId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsDefaultVersion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CreateDate: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A list containing information about managed policies.",
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
        additionalProperties: true,
      },
    },
  },
};

export default getAccountAuthorizationDetails;
