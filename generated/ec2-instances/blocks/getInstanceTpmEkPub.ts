import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, GetInstanceTpmEkPubCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInstanceTpmEkPub: AppBlock = {
  name: "Get Instance Tpm Ek Pub",
  description: `Gets the public endorsement key associated with the Nitro Trusted Platform Module (NitroTPM) for the specified instance.`,
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
        InstanceId: {
          name: "Instance Id",
          description:
            "The ID of the instance for which to get the public endorsement key.",
          type: "string",
          required: true,
        },
        KeyType: {
          name: "Key Type",
          description: "The required public endorsement key type.",
          type: "string",
          required: true,
        },
        KeyFormat: {
          name: "Key Format",
          description: "The required public endorsement key format.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Specify this parameter to verify whether the request will succeed, without actually making the request.",
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

        const command = new GetInstanceTpmEkPubCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Instance Tpm Ek Pub Result",
      description: "Result from GetInstanceTpmEkPub operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceId: {
            type: "string",
            description: "The ID of the instance.",
          },
          KeyType: {
            type: "string",
            description: "The public endorsement key type.",
          },
          KeyFormat: {
            type: "string",
            description: "The public endorsement key format.",
          },
          KeyValue: {
            type: "string",
            description: "The public endorsement key material.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getInstanceTpmEkPub;
