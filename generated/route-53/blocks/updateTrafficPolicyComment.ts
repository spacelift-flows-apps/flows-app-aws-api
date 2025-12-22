import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  UpdateTrafficPolicyCommentCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateTrafficPolicyComment: AppBlock = {
  name: "Update Traffic Policy Comment",
  description: `Updates the comment for a specified traffic policy version.`,
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
        Id: {
          name: "Id",
          description:
            "The value of Id for the traffic policy that you want to update the comment for.",
          type: "string",
          required: true,
        },
        Version: {
          name: "Version",
          description:
            "The value of Version for the traffic policy that you want to update the comment for.",
          type: "number",
          required: true,
        },
        Comment: {
          name: "Comment",
          description:
            "The new comment for the specified traffic policy and version.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateTrafficPolicyCommentCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Traffic Policy Comment Result",
      description: "Result from UpdateTrafficPolicyComment operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrafficPolicy: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Version: {
                type: "number",
              },
              Name: {
                type: "string",
              },
              Type: {
                type: "string",
              },
              Document: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
            },
            required: ["Id", "Version", "Name", "Type", "Document"],
            additionalProperties: false,
            description:
              "A complex type that contains settings for the specified traffic policy.",
          },
        },
        required: ["TrafficPolicy"],
      },
    },
  },
};

export default updateTrafficPolicyComment;
