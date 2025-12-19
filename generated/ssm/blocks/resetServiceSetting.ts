import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ResetServiceSettingCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const resetServiceSetting: AppBlock = {
  name: "Reset Service Setting",
  description: `ServiceSetting is an account-level setting for an Amazon Web Services service.`,
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
        SettingId: {
          name: "Setting Id",
          description:
            "The Amazon Resource Name (ARN) of the service setting to reset.",
          type: "string",
          required: true,
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ResetServiceSettingCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Reset Service Setting Result",
      description: "Result from ResetServiceSetting operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServiceSetting: {
            type: "object",
            properties: {
              SettingId: {
                type: "string",
              },
              SettingValue: {
                type: "string",
              },
              LastModifiedDate: {
                type: "string",
              },
              LastModifiedUser: {
                type: "string",
              },
              ARN: {
                type: "string",
              },
              Status: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The current, effective service setting after calling the ResetServiceSetting API operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default resetServiceSetting;
