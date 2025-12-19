import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetAnycastIpListCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAnycastIpList: AppBlock = {
  name: "Get Anycast Ip List",
  description: `Gets an Anycast static IP list.`,
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
          description: "The ID of the Anycast static IP list.",
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

        const command = new GetAnycastIpListCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Anycast Ip List Result",
      description: "Result from GetAnycastIpList operation",
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
            description: "The Anycast static IP list details.",
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

export default getAnycastIpList;
