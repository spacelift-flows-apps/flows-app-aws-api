import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetVpcOriginCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getVpcOrigin: AppBlock = {
  name: "Get Vpc Origin",
  description: `Get the details of an Amazon CloudFront VPC origin.`,
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
          description: "The VPC origin ID.",
          type: "string",
          required: true,
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetVpcOriginCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Vpc Origin Result",
      description: "Result from GetVpcOrigin operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          VpcOrigin: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              CreatedTime: {
                type: "string",
              },
              LastModifiedTime: {
                type: "string",
              },
              VpcOriginEndpointConfig: {
                type: "object",
                properties: {
                  Name: {
                    type: "string",
                  },
                  Arn: {
                    type: "string",
                  },
                  HTTPPort: {
                    type: "number",
                  },
                  HTTPSPort: {
                    type: "number",
                  },
                  OriginProtocolPolicy: {
                    type: "string",
                  },
                  OriginSslProtocols: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["Quantity", "Items"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "Name",
                  "Arn",
                  "HTTPPort",
                  "HTTPSPort",
                  "OriginProtocolPolicy",
                ],
                additionalProperties: false,
              },
            },
            required: [
              "Id",
              "Arn",
              "Status",
              "CreatedTime",
              "LastModifiedTime",
              "VpcOriginEndpointConfig",
            ],
            additionalProperties: false,
            description: "The VPC origin.",
          },
          ETag: {
            type: "string",
            description: "The VPC origin ETag.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getVpcOrigin;
