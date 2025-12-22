import { AppBlock, events } from "@slflows/sdk/v1";
import { ECRClient, GetAuthorizationTokenCommand } from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAuthorizationToken: AppBlock = {
  name: "Get Authorization Token",
  description: `Retrieves an authorization token.`,
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
        registryIds: {
          name: "registry Ids",
          description:
            "A list of Amazon Web Services account IDs that are associated with the registries for which to get AuthorizationData objects.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAuthorizationTokenCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Authorization Token Result",
      description: "Result from GetAuthorizationToken operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          authorizationData: {
            type: "array",
            items: {
              type: "object",
              properties: {
                authorizationToken: {
                  type: "string",
                },
                expiresAt: {
                  type: "string",
                },
                proxyEndpoint: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of authorization token data objects that correspond to the registryIds values in the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getAuthorizationToken;
