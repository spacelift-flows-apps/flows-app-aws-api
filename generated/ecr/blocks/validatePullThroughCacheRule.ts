import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  ValidatePullThroughCacheRuleCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const validatePullThroughCacheRule: AppBlock = {
  name: "Validate Pull Through Cache Rule",
  description: `Validates an existing pull through cache rule for an upstream registry that requires authentication.`,
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
        ecrRepositoryPrefix: {
          name: "ecr Repository Prefix",
          description:
            "The repository name prefix associated with the pull through cache rule.",
          type: "string",
          required: true,
        },
        registryId: {
          name: "registry Id",
          description:
            "The registry ID associated with the pull through cache rule.",
          type: "string",
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ValidatePullThroughCacheRuleCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Validate Pull Through Cache Rule Result",
      description: "Result from ValidatePullThroughCacheRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ecrRepositoryPrefix: {
            type: "string",
            description:
              "The Amazon ECR repository prefix associated with the pull through cache rule.",
          },
          registryId: {
            type: "string",
            description: "The registry ID associated with the request.",
          },
          upstreamRegistryUrl: {
            type: "string",
            description:
              "The upstream registry URL associated with the pull through cache rule.",
          },
          credentialArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the Amazon Web Services Secrets Manager secret associated with the pull through cache rule.",
          },
          customRoleArn: {
            type: "string",
            description:
              "The ARN of the IAM role associated with the pull through cache rule.",
          },
          upstreamRepositoryPrefix: {
            type: "string",
            description:
              "The upstream repository prefix associated with the pull through cache rule.",
          },
          isValid: {
            type: "boolean",
            description:
              "Whether or not the pull through cache rule was validated.",
          },
          failure: {
            type: "string",
            description: "The reason the validation failed.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default validatePullThroughCacheRule;
