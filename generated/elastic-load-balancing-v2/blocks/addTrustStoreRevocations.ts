import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  AddTrustStoreRevocationsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const addTrustStoreRevocations: AppBlock = {
  name: "Add Trust Store Revocations",
  description: `Adds the specified revocation file to the specified trust store.`,
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
        TrustStoreArn: {
          name: "Trust Store Arn",
          description: "The Amazon Resource Name (ARN) of the trust store.",
          type: "string",
          required: true,
        },
        RevocationContents: {
          name: "Revocation Contents",
          description: "The revocation file to add.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                S3Bucket: {
                  type: "string",
                },
                S3Key: {
                  type: "string",
                },
                S3ObjectVersion: {
                  type: "string",
                },
                RevocationType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AddTrustStoreRevocationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Add Trust Store Revocations Result",
      description: "Result from AddTrustStoreRevocations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrustStoreRevocations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TrustStoreArn: {
                  type: "string",
                },
                RevocationId: {
                  type: "number",
                },
                RevocationType: {
                  type: "string",
                },
                NumberOfRevokedEntries: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the revocation file added to the trust store.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default addTrustStoreRevocations;
