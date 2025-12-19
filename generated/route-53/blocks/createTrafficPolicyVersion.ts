import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  CreateTrafficPolicyVersionCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTrafficPolicyVersion: AppBlock = {
  name: "Create Traffic Policy Version",
  description: `Creates a new version of an existing traffic policy.`,
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
            "The ID of the traffic policy for which you want to create a new version.",
          type: "string",
          required: true,
        },
        Document: {
          name: "Document",
          description:
            "The definition of this version of the traffic policy, in JSON format.",
          type: "string",
          required: true,
        },
        Comment: {
          name: "Comment",
          description:
            "The comment that you specified in the CreateTrafficPolicyVersion request, if any.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateTrafficPolicyVersionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Traffic Policy Version Result",
      description: "Result from CreateTrafficPolicyVersion operation",
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
              "A complex type that contains settings for the new version of the traffic policy.",
          },
          Location: {
            type: "string",
            description:
              "A unique URL that represents a new traffic policy version.",
          },
        },
        required: ["TrafficPolicy", "Location"],
      },
    },
  },
};

export default createTrafficPolicyVersion;
