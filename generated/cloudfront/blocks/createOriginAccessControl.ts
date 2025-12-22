import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateOriginAccessControlCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createOriginAccessControl: AppBlock = {
  name: "Create Origin Access Control",
  description: `Creates a new origin access control in CloudFront.`,
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
        OriginAccessControlConfig: {
          name: "Origin Access Control Config",
          description: "Contains the origin access control.",
          type: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              SigningProtocol: {
                type: "string",
              },
              SigningBehavior: {
                type: "string",
              },
              OriginAccessControlOriginType: {
                type: "string",
              },
            },
            required: [
              "Name",
              "SigningProtocol",
              "SigningBehavior",
              "OriginAccessControlOriginType",
            ],
            additionalProperties: false,
          },
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateOriginAccessControlCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Origin Access Control Result",
      description: "Result from CreateOriginAccessControl operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          OriginAccessControl: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              OriginAccessControlConfig: {
                type: "object",
                properties: {
                  Name: {
                    type: "string",
                  },
                  Description: {
                    type: "string",
                  },
                  SigningProtocol: {
                    type: "string",
                  },
                  SigningBehavior: {
                    type: "string",
                  },
                  OriginAccessControlOriginType: {
                    type: "string",
                  },
                },
                required: [
                  "Name",
                  "SigningProtocol",
                  "SigningBehavior",
                  "OriginAccessControlOriginType",
                ],
                additionalProperties: false,
              },
            },
            required: ["Id"],
            additionalProperties: false,
            description: "Contains an origin access control.",
          },
          Location: {
            type: "string",
            description: "The URL of the origin access control.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the origin access control.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createOriginAccessControl;
