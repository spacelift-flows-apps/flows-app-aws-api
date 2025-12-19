import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyLaunchTemplateCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyLaunchTemplate: AppBlock = {
  name: "Modify Launch Template",
  description: `Modifies a launch template.`,
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
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        LaunchTemplateId: {
          name: "Launch Template Id",
          description: "The ID of the launch template.",
          type: "string",
          required: false,
        },
        LaunchTemplateName: {
          name: "Launch Template Name",
          description: "The name of the launch template.",
          type: "string",
          required: false,
        },
        DefaultVersion: {
          name: "Default Version",
          description:
            "The version number of the launch template to set as the default version.",
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

        const command = new ModifyLaunchTemplateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Launch Template Result",
      description: "Result from ModifyLaunchTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LaunchTemplate: {
            type: "object",
            properties: {
              LaunchTemplateId: {
                type: "string",
              },
              LaunchTemplateName: {
                type: "string",
              },
              CreateTime: {
                type: "string",
              },
              CreatedBy: {
                type: "string",
              },
              DefaultVersionNumber: {
                type: "number",
              },
              LatestVersionNumber: {
                type: "number",
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
                  additionalProperties: false,
                },
              },
              Operator: {
                type: "object",
                properties: {
                  Managed: {
                    type: "boolean",
                  },
                  Principal: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
            description: "Information about the launch template.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyLaunchTemplate;
