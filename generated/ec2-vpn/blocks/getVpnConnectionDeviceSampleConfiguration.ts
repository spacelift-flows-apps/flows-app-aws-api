import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetVpnConnectionDeviceSampleConfigurationCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getVpnConnectionDeviceSampleConfiguration: AppBlock = {
  name: "Get Vpn Connection Device Sample Configuration",
  description: `Download an Amazon Web Services-provided sample configuration file to be used with the customer gateway device specified for your Site-to-Site VPN connection.`,
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
        VpnConnectionId: {
          name: "Vpn Connection Id",
          description:
            "The VpnConnectionId specifies the Site-to-Site VPN connection used for the sample configuration.",
          type: "string",
          required: true,
        },
        VpnConnectionDeviceTypeId: {
          name: "Vpn Connection Device Type Id",
          description:
            "Device identifier provided by the GetVpnConnectionDeviceTypes API.",
          type: "string",
          required: true,
        },
        InternetKeyExchangeVersion: {
          name: "Internet Key Exchange Version",
          description:
            "The IKE version to be used in the sample configuration file for your customer gateway device.",
          type: "string",
          required: false,
        },
        SampleType: {
          name: "Sample Type",
          description: "The type of sample configuration to generate.",
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

        const command = new GetVpnConnectionDeviceSampleConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Vpn Connection Device Sample Configuration Result",
      description:
        "Result from GetVpnConnectionDeviceSampleConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpnConnectionDeviceSampleConfiguration: {
            type: "string",
            description:
              "Sample configuration file for the specified customer gateway device.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getVpnConnectionDeviceSampleConfiguration;
