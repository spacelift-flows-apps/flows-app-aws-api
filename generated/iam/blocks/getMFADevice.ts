import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, GetMFADeviceCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getMFADevice: AppBlock = {
  name: "Get MFA Device",
  description: `Retrieves information about an MFA device for a specified user.`,
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
        SerialNumber: {
          name: "Serial Number",
          description: "Serial number that uniquely identifies the MFA device.",
          type: "string",
          required: true,
        },
        UserName: {
          name: "User Name",
          description: "The friendly name identifying the user.",
          type: "string",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetMFADeviceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get MFA Device Result",
      description: "Result from GetMFADevice operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          UserName: {
            type: "string",
            description: "The friendly name identifying the user.",
          },
          SerialNumber: {
            type: "string",
            description:
              "Serial number that uniquely identifies the MFA device.",
          },
          EnableDate: {
            type: "string",
            description:
              "The date that a specified user's MFA device was first enabled.",
          },
          Certifications: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
            description: "The certifications of a specified user's MFA device.",
          },
        },
        required: ["SerialNumber"],
      },
    },
  },
};

export default getMFADevice;
