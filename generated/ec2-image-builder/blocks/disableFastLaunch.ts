import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DisableFastLaunchCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const disableFastLaunch: AppBlock = {
  name: "Disable Fast Launch",
  description: `Discontinue Windows fast launch for a Windows AMI, and clean up existing pre-provisioned snapshots.`,
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
            "Specify the ID of the image for which to disable Windows fast launch.",
          type: "string",
          required: true,
        },
        Force: {
          name: "Force",
          description:
            "Forces the image settings to turn off Windows fast launch for your Windows AMI.",
          type: "boolean",
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

        const command = new DisableFastLaunchCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Disable Fast Launch Result",
      description: "Result from DisableFastLaunch operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ImageId: {
            type: "string",
            description:
              "The ID of the image for which Windows fast launch was disabled.",
          },
          ResourceType: {
            type: "string",
            description:
              "The pre-provisioning resource type that must be cleaned after turning off Windows fast launch for the Windows AMI.",
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
              "Parameters that were used for Windows fast launch for the Windows AMI before Windows fast launch was disabled.",
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
              "The launch template that was used to launch Windows instances from pre-provisioned snapshots.",
          },
          MaxParallelLaunches: {
            type: "number",
            description:
              "The maximum number of instances that Amazon EC2 can launch at the same time to create pre-provisioned snapshots for Windows fast launch.",
          },
          OwnerId: {
            type: "string",
            description:
              "The owner of the Windows AMI for which Windows fast launch was disabled.",
          },
          State: {
            type: "string",
            description:
              "The current state of Windows fast launch for the specified Windows AMI.",
          },
          StateTransitionReason: {
            type: "string",
            description:
              "The reason that the state changed for Windows fast launch for the Windows AMI.",
          },
          StateTransitionTime: {
            type: "string",
            description:
              "The time that the state changed for Windows fast launch for the Windows AMI.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default disableFastLaunch;
