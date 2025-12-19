import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DetachVolumeCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const detachVolume: AppBlock = {
  name: "Detach Volume",
  description: `Detaches an EBS volume from an instance.`,
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
          description: "The device name.",
          type: "string",
          required: false,
        },
        Force: {
          name: "Force",
          description:
            "Forces detachment if the previous detachment attempt did not occur cleanly (for example, logging into an instance, unmounting the volume, and detaching normally).",
          type: "boolean",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance.",
          type: "string",
          required: false,
        },
        VolumeId: {
          name: "Volume Id",
          description: "The ID of the volume.",
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

        const command = new DetachVolumeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Detach Volume Result",
      description: "Result from DetachVolume operation",
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

export default detachVolume;
