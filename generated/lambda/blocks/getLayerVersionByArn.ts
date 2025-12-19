import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  GetLayerVersionByArnCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getLayerVersionByArn: AppBlock = {
  name: "Get Layer Version By Arn",
  description: `Returns information about a version of an Lambda layer, with a link to download the layer archive that's valid for 10 minutes.`,
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
        Arn: {
          name: "Arn",
          description: "The ARN of the layer version.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetLayerVersionByArnCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Layer Version By Arn Result",
      description: "Result from GetLayerVersionByArn operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Content: {
            type: "object",
            properties: {
              Location: {
                type: "string",
              },
              CodeSha256: {
                type: "string",
              },
              CodeSize: {
                type: "number",
              },
              SigningProfileVersionArn: {
                type: "string",
              },
              SigningJobArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Details about the layer version.",
          },
          LayerArn: {
            type: "string",
            description: "The ARN of the layer.",
          },
          LayerVersionArn: {
            type: "string",
            description: "The ARN of the layer version.",
          },
          Description: {
            type: "string",
            description: "The description of the version.",
          },
          CreatedDate: {
            type: "string",
            description:
              "The date that the layer version was created, in ISO-8601 format (YYYY-MM-DDThh:mm:ss.",
          },
          Version: {
            type: "number",
            description: "The version number.",
          },
          CompatibleRuntimes: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The layer's compatible runtimes.",
          },
          LicenseInfo: {
            type: "string",
            description: "The layer's software license.",
          },
          CompatibleArchitectures: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of compatible instruction set architectures.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getLayerVersionByArn;
