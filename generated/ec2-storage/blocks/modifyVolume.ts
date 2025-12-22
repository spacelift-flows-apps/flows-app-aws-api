import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyVolumeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVolume: AppBlock = {
  name: "Modify Volume",
  description: `You can modify several parameters of an existing EBS volume, including volume size, volume type, and IOPS capacity.`,
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
        VolumeId: {
          name: "Volume Id",
          description: "The ID of the volume.",
          type: "string",
          required: true,
        },
        Size: {
          name: "Size",
          description: "The target size of the volume, in GiB.",
          type: "number",
          required: false,
        },
        VolumeType: {
          name: "Volume Type",
          description: "The target EBS volume type of the volume.",
          type: "string",
          required: false,
        },
        Iops: {
          name: "Iops",
          description: "The target IOPS rate of the volume.",
          type: "number",
          required: false,
        },
        Throughput: {
          name: "Throughput",
          description: "The target throughput of the volume, in MiB/s.",
          type: "number",
          required: false,
        },
        MultiAttachEnabled: {
          name: "Multi Attach Enabled",
          description: "Specifies whether to enable Amazon EBS Multi-Attach.",
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

        const command = new ModifyVolumeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Volume Result",
      description: "Result from ModifyVolume operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VolumeModification: {
            type: "object",
            properties: {
              VolumeId: {
                type: "string",
              },
              ModificationState: {
                type: "string",
              },
              StatusMessage: {
                type: "string",
              },
              TargetSize: {
                type: "number",
              },
              TargetIops: {
                type: "number",
              },
              TargetVolumeType: {
                type: "string",
              },
              TargetThroughput: {
                type: "number",
              },
              TargetMultiAttachEnabled: {
                type: "boolean",
              },
              OriginalSize: {
                type: "number",
              },
              OriginalIops: {
                type: "number",
              },
              OriginalVolumeType: {
                type: "string",
              },
              OriginalThroughput: {
                type: "number",
              },
              OriginalMultiAttachEnabled: {
                type: "boolean",
              },
              Progress: {
                type: "number",
              },
              StartTime: {
                type: "string",
              },
              EndTime: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the volume modification.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyVolume;
