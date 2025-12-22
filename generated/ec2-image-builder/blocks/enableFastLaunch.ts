import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, EnableFastLaunchCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const enableFastLaunch: AppBlock = {
  name: "Enable Fast Launch",
  description: `When you enable Windows fast launch for a Windows AMI, images are pre-provisioned, using snapshots to launch instances up to 65% faster.`,
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
        ImageId: {
          name: "Image Id",
          description:
            "Specify the ID of the image for which to enable Windows fast launch.",
          type: "string",
          required: true,
        },
        ResourceType: {
          name: "Resource Type",
          description:
            "The type of resource to use for pre-provisioning the AMI for Windows fast launch.",
          type: "string",
          required: false,
        },
        SnapshotConfiguration: {
          name: "Snapshot Configuration",
          description:
            "Configuration settings for creating and managing the snapshots that are used for pre-provisioning the AMI for Windows fast launch.",
          type: {
            type: "object",
            properties: {
              TargetResourceCount: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        LaunchTemplate: {
          name: "Launch Template",
          description:
            "The launch template to use when launching Windows instances from pre-provisioned snapshots.",
          type: {
            type: "object",
            properties: {
              LaunchTemplateId: {
                type: "string",
              },
              LaunchTemplateName: {
                type: "string",
              },
              Version: {
                type: "string",
              },
            },
            required: ["Version"],
            additionalProperties: false,
          },
          required: false,
        },
        MaxParallelLaunches: {
          name: "Max Parallel Launches",
          description:
            "The maximum number of instances that Amazon EC2 can launch at the same time to create pre-provisioned snapshots for Windows fast launch.",
          type: "number",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new EnableFastLaunchCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Enable Fast Launch Result",
      description: "Result from EnableFastLaunch operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImageId: {
            type: "string",
            description:
              "The image ID that identifies the AMI for which Windows fast launch was enabled.",
          },
          ResourceType: {
            type: "string",
            description:
              "The type of resource that was defined for pre-provisioning the AMI for Windows fast launch.",
          },
          SnapshotConfiguration: {
            type: "object",
            properties: {
              TargetResourceCount: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "Settings to create and manage the pre-provisioned snapshots that Amazon EC2 uses for faster launches from the Windows AMI.",
          },
          LaunchTemplate: {
            type: "object",
            properties: {
              LaunchTemplateId: {
                type: "string",
              },
              LaunchTemplateName: {
                type: "string",
              },
              Version: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The launch template that is used when launching Windows instances from pre-provisioned snapshots.",
          },
          MaxParallelLaunches: {
            type: "number",
            description:
              "The maximum number of instances that Amazon EC2 can launch at the same time to create pre-provisioned snapshots for Windows fast launch.",
          },
          OwnerId: {
            type: "string",
            description:
              "The owner ID for the AMI for which Windows fast launch was enabled.",
          },
          State: {
            type: "string",
            description:
              "The current state of Windows fast launch for the specified AMI.",
          },
          StateTransitionReason: {
            type: "string",
            description:
              "The reason that the state changed for Windows fast launch for the AMI.",
          },
          StateTransitionTime: {
            type: "string",
            description:
              "The time that the state changed for Windows fast launch for the AMI.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default enableFastLaunch;
