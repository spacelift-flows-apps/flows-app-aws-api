import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, DiscoverPollEndpointCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const discoverPollEndpoint: AppBlock = {
  name: "Discover Poll Endpoint",
  description: `This action is only used by the Amazon ECS agent, and it is not intended for use outside of the agent.`,
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
        containerInstance: {
          name: "container Instance",
          description:
            "The container instance ID or full ARN of the container instance.",
          type: "string",
          required: false,
        },
        cluster: {
          name: "cluster",
          description:
            "The short name or full Amazon Resource Name (ARN) of the cluster that the container instance belongs to.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DiscoverPollEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Discover Poll Endpoint Result",
      description: "Result from DiscoverPollEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          endpoint: {
            type: "string",
            description: "The endpoint for the Amazon ECS agent to poll.",
          },
          telemetryEndpoint: {
            type: "string",
            description: "The telemetry endpoint for the Amazon ECS agent.",
          },
          serviceConnectEndpoint: {
            type: "string",
            description:
              "The endpoint for the Amazon ECS agent to poll for Service Connect configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default discoverPollEndpoint;
