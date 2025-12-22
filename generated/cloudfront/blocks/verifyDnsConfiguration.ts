import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  VerifyDnsConfigurationCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const verifyDnsConfiguration: AppBlock = {
  name: "Verify Dns Configuration",
  description: `Verify the DNS configuration for your domain names.`,
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
        Domain: {
          name: "Domain",
          description: "The domain name that you're verifying.",
          type: "string",
          required: false,
        },
        Identifier: {
          name: "Identifier",
          description: "The identifier of the distribution tenant.",
          type: "string",
          required: true,
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new VerifyDnsConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Verify Dns Configuration Result",
      description: "Result from VerifyDnsConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DnsConfigurationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Domain: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                Reason: {
                  type: "string",
                },
              },
              required: ["Domain", "Status"],
              additionalProperties: false,
            },
            description:
              "The list of domain names, their statuses, and a description of each status.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default verifyDnsConfiguration;
