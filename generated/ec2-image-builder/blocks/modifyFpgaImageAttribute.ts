import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyFpgaImageAttributeCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyFpgaImageAttribute: AppBlock = {
  name: "Modify Fpga Image Attribute",
  description: `Modifies the specified attribute of the specified Amazon FPGA Image (AFI).`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        FpgaImageId: {
          name: "Fpga Image Id",
          description: "The ID of the AFI.",
          type: "string",
          required: true,
        },
        Attribute: {
          name: "Attribute",
          description: "The name of the attribute.",
          type: "string",
          required: false,
        },
        OperationType: {
          name: "Operation Type",
          description: "The operation type.",
          type: "string",
          required: false,
        },
        UserIds: {
          name: "User Ids",
          description: "The Amazon Web Services account IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        UserGroups: {
          name: "User Groups",
          description: "The user groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ProductCodes: {
          name: "Product Codes",
          description: "The product codes.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        LoadPermission: {
          name: "Load Permission",
          description: "The load permission for the AFI.",
          type: {
            type: "object",
            properties: {
              Add: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Group: {
                      type: "string",
                    },
                    UserId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Remove: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Group: {
                      type: "string",
                    },
                    UserId: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description for the AFI.",
          type: "string",
          required: false,
        },
        Name: {
          name: "Name",
          description: "A name for the AFI.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyFpgaImageAttributeCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Fpga Image Attribute Result",
      description: "Result from ModifyFpgaImageAttribute operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FpgaImageAttribute: {
            type: "object",
            properties: {
              FpgaImageId: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              LoadPermissions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    UserId: {
                      type: "string",
                    },
                    Group: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              ProductCodes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ProductCodeId: {
                      type: "string",
                    },
                    ProductCodeType: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "Information about the attribute.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyFpgaImageAttribute;
