import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  GetOutboundWebIdentityFederationInfoCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getOutboundWebIdentityFederationInfo: AppBlock = {
  name: "Get Outbound Web Identity Federation Info",
  description: `Retrieves the configuration information for the outbound identity federation feature in your Amazon Web Services account.`,
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

        const command = new GetOutboundWebIdentityFederationInfoCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Outbound Web Identity Federation Info Result",
      description: "Result from GetOutboundWebIdentityFederationInfo operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IssuerIdentifier: {
            type: "string",
            description:
              "A unique issuer URL for your Amazon Web Services account that hosts the OpenID Connect (OIDC) discovery endpoints at /.",
          },
          JwtVendingEnabled: {
            type: "boolean",
            description:
              "Indicates whether outbound identity federation is currently enabled for your Amazon Web Services account.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getOutboundWebIdentityFederationInfo;
