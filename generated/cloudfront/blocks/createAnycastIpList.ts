import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  CreateAnycastIpListCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createAnycastIpList: AppBlock = {
  name: "Create Anycast Ip List",
  description: `Creates an Anycast static IP list.`,
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
          description: "Name of the Anycast static IP list.",
          type: "string",
          required: true,
        },
        IpCount: {
          name: "Ip Count",
          description:
            "The number of static IP addresses that are allocated to the Anycast static IP list.",
          type: "number",
          required: true,
        },
        Tags: {
          name: "Tags",
          description:
            "A complex type that contains zero or more Tag elements.",
          type: {
            type: "object",
            properties: {
              Items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Key"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateAnycastIpListCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Anycast Ip List Result",
      description: "Result from CreateAnycastIpList operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AnycastIpList: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              AnycastIps: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              IpCount: {
                type: "number",
              },
              LastModifiedTime: {
                type: "string",
              },
            },
            required: [
              "Id",
              "Name",
              "Status",
              "Arn",
              "AnycastIps",
              "IpCount",
              "LastModifiedTime",
            ],
            additionalProperties: false,
            description:
              "A response structure that includes the version identifier (ETag) and the created AnycastIpList structure.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the Anycast static IP list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createAnycastIpList;
