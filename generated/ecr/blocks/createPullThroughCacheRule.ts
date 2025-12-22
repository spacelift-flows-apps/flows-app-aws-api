import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  CreatePullThroughCacheRuleCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPullThroughCacheRule: AppBlock = {
  name: "Create Pull Through Cache Rule",
  description: `Creates a pull through cache rule.`,
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
            "The repository name prefix to use when caching images from the source registry.",
          type: "string",
          required: true,
        },
        upstreamRegistryUrl: {
          name: "upstream Registry Url",
          description:
            "The registry URL of the upstream public registry to use as the source for the pull through cache rule.",
          type: "string",
          required: true,
        },
        registryId: {
          name: "registry Id",
          description:
            "The Amazon Web Services account ID associated with the registry to create the pull through cache rule for.",
          type: "string",
          required: false,
        },
        upstreamRegistry: {
          name: "upstream Registry",
          description: "The name of the upstream registry.",
          type: "string",
          required: false,
        },
        credentialArn: {
          name: "credential Arn",
          description:
            "The Amazon Resource Name (ARN) of the Amazon Web Services Secrets Manager secret that identifies the credentials to authenticate to the upstream registry.",
          type: "string",
          required: false,
        },
        customRoleArn: {
          name: "custom Role Arn",
          description:
            "Amazon Resource Name (ARN) of the IAM role to be assumed by Amazon ECR to authenticate to the ECR upstream registry.",
          type: "string",
          required: false,
        },
        upstreamRepositoryPrefix: {
          name: "upstream Repository Prefix",
          description:
            "The repository name prefix of the upstream registry to match with the upstream repository name.",
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreatePullThroughCacheRuleCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Pull Through Cache Rule Result",
      description: "Result from CreatePullThroughCacheRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ecrRepositoryPrefix: {
            type: "string",
            description:
              "The Amazon ECR repository prefix associated with the pull through cache rule.",
          },
          upstreamRegistryUrl: {
            type: "string",
            description:
              "The upstream registry URL associated with the pull through cache rule.",
          },
          createdAt: {
            type: "string",
            description:
              "The date and time, in JavaScript date format, when the pull through cache rule was created.",
          },
          registryId: {
            type: "string",
            description: "The registry ID associated with the request.",
          },
          upstreamRegistry: {
            type: "string",
            description:
              "The name of the upstream registry associated with the pull through cache rule.",
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
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPullThroughCacheRule;
