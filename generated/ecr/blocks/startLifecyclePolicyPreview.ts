import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  StartLifecyclePolicyPreviewCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startLifecyclePolicyPreview: AppBlock = {
  name: "Start Lifecycle Policy Preview",
  description: `Starts a preview of a lifecycle policy for the specified repository.`,
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
        registryId: {
          name: "registry Id",
          description:
            "The Amazon Web Services account ID associated with the registry that contains the repository.",
          type: "string",
          required: false,
        },
        repositoryName: {
          name: "repository Name",
          description: "The name of the repository to be evaluated.",
          type: "string",
          required: true,
        },
        lifecyclePolicyText: {
          name: "lifecycle Policy Text",
          description: "The policy to be evaluated against.",
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

        const command = new StartLifecyclePolicyPreviewCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Lifecycle Policy Preview Result",
      description: "Result from StartLifecyclePolicyPreview operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          registryId: {
            type: "string",
            description: "The registry ID associated with the request.",
          },
          repositoryName: {
            type: "string",
            description: "The repository name associated with the request.",
          },
          lifecyclePolicyText: {
            type: "string",
            description: "The JSON repository policy text.",
          },
          status: {
            type: "string",
            description: "The status of the lifecycle policy preview request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startLifecyclePolicyPreview;
