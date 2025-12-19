import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  UpdateHostedZoneCommentCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateHostedZoneComment: AppBlock = {
  name: "Update Hosted Zone Comment",
  description: `Updates the comment for a specified hosted zone.`,
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
            "The ID for the hosted zone that you want to update the comment for.",
          type: "string",
          required: true,
        },
        Comment: {
          name: "Comment",
          description: "The new comment for the hosted zone.",
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

        const command = new UpdateHostedZoneCommentCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Hosted Zone Comment Result",
      description: "Result from UpdateHostedZoneComment operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HostedZone: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              CallerReference: {
                type: "string",
              },
              Config: {
                type: "object",
                properties: {
                  Comment: {
                    type: "string",
                  },
                  PrivateZone: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              ResourceRecordSetCount: {
                type: "number",
              },
              LinkedService: {
                type: "object",
                properties: {
                  ServicePrincipal: {
                    type: "string",
                  },
                  Description: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["Id", "Name", "CallerReference"],
            additionalProperties: false,
            description:
              "A complex type that contains the response to the UpdateHostedZoneComment request.",
          },
        },
        required: ["HostedZone"],
      },
    },
  },
};

export default updateHostedZoneComment;
