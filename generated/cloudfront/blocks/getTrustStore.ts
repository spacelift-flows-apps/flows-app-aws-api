import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetTrustStoreCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTrustStore: AppBlock = {
  name: "Get Trust Store",
  description: `Gets a trust store.`,
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
        Identifier: {
          name: "Identifier",
          description: "The trust store's identifier.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetTrustStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Trust Store Result",
      description: "Result from GetTrustStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrustStore: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              Status: {
                type: "string",
                enum: ["pending", "active", "failed"],
              },
              NumberOfCaCertificates: {
                type: "number",
              },
              LastModifiedTime: {
                type: "string",
              },
              Reason: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The trust store.",
          },
          ETag: {
            type: "string",
            description:
              "The version identifier for the current version of the trust store.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTrustStore;
