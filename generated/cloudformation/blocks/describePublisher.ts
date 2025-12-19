import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribePublisherCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describePublisher: AppBlock = {
  name: "Describe Publisher",
  description: `Returns information about a CloudFormation extension publisher.`,
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
        PublisherId: {
          name: "Publisher Id",
          description: "The ID of the extension publisher.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribePublisherCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Publisher Result",
      description: "Result from DescribePublisher operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PublisherId: {
            type: "string",
            description: "The ID of the extension publisher.",
          },
          PublisherStatus: {
            type: "string",
            description: "Whether the publisher is verified.",
          },
          IdentityProvider: {
            type: "string",
            description:
              "The type of account used as the identity provider when registering this publisher with CloudFormation.",
          },
          PublisherProfile: {
            type: "string",
            description:
              "The URL to the publisher's profile with the identity provider.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describePublisher;
