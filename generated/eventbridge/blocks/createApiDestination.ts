import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EventBridgeClient,
  CreateApiDestinationCommand,
} from "@aws-sdk/client-eventbridge";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createApiDestination: AppBlock = {
  name: "Create Api Destination",
  description: `Creates an API destination, which is an HTTP invocation endpoint configured as a target for events.`,
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
        Name: {
          name: "Name",
          description: "The name for the API destination to create.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the API destination to create.",
          type: "string",
          required: false,
        },
        ConnectionArn: {
          name: "Connection Arn",
          description:
            "The ARN of the connection to use for the API destination.",
          type: "string",
          required: true,
        },
        InvocationEndpoint: {
          name: "Invocation Endpoint",
          description:
            "The URL to the HTTP invocation endpoint for the API destination.",
          type: "string",
          required: true,
        },
        HttpMethod: {
          name: "Http Method",
          description:
            "The method to use for the request to the HTTP invocation endpoint.",
          type: "string",
          required: true,
        },
        InvocationRateLimitPerSecond: {
          name: "Invocation Rate Limit Per Second",
          description:
            "The maximum number of requests per second to send to the HTTP invocation endpoint.",
          type: "number",
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

        const client = new EventBridgeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateApiDestinationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Api Destination Result",
      description: "Result from CreateApiDestination operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ApiDestinationArn: {
            type: "string",
            description:
              "The ARN of the API destination that was created by the request.",
          },
          ApiDestinationState: {
            type: "string",
            description:
              "The state of the API destination that was created by the request.",
          },
          CreationTime: {
            type: "string",
            description:
              "A time stamp indicating the time that the API destination was created.",
          },
          LastModifiedTime: {
            type: "string",
            description:
              "A time stamp indicating the time that the API destination was last modified.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createApiDestination;
