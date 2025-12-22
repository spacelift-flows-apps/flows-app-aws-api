import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, AttachVolumeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const attachVolume: AppBlock = {
  name: "Attach Volume",
  description: `Attaches an Amazon EBS volume to a running or stopped instance, and exposes it to the instance with the specified device name.`,
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
        Device: {
          name: "Device",
          description: "The device name (for example, /dev/sdh or xvdh).",
          type: "string",
          required: true,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance.",
          type: "string",
          required: true,
        },
        VolumeId: {
          name: "Volume Id",
          description: "The ID of the EBS volume.",
          type: "string",
          required: true,
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AttachVolumeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Attach Volume Result",
      description: "Result from AttachVolume operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DeleteOnTermination: {
            type: "boolean",
            description:
              "Indicates whether the EBS volume is deleted on instance termination.",
          },
          AssociatedResource: {
            type: "string",
            description:
              "The ARN of the Amazon Web Services-managed resource to which the volume is attached.",
          },
          InstanceOwningService: {
            type: "string",
            description:
              "The service principal of the Amazon Web Services service that owns the underlying resource to which the volume is attached.",
          },
          VolumeId: {
            type: "string",
            description: "The ID of the volume.",
          },
          InstanceId: {
            type: "string",
            description: "The ID of the instance.",
          },
          Device: {
            type: "string",
            description: "The device name.",
          },
          State: {
            type: "string",
            description: "The attachment state of the volume.",
          },
          AttachTime: {
            type: "string",
            description: "The time stamp when the attachment initiated.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default attachVolume;
