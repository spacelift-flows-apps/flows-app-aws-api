import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  CreateTrustStoreCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTrustStore: AppBlock = {
  name: "Create Trust Store",
  description: `Creates a trust store.`,
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
          description: "The name of the trust store.",
          type: "string",
          required: true,
        },
        CaCertificatesBundleS3Bucket: {
          name: "Ca Certificates Bundle S3Bucket",
          description: "The Amazon S3 bucket for the ca certificates bundle.",
          type: "string",
          required: true,
        },
        CaCertificatesBundleS3Key: {
          name: "Ca Certificates Bundle S3Key",
          description: "The Amazon S3 path for the ca certificates bundle.",
          type: "string",
          required: true,
        },
        CaCertificatesBundleS3ObjectVersion: {
          name: "Ca Certificates Bundle S3Object Version",
          description:
            "The Amazon S3 object version for the ca certificates bundle.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the trust store.",
          type: {
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

        const command = new CreateTrustStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Trust Store Result",
      description: "Result from CreateTrustStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrustStores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                TrustStoreArn: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                NumberOfCaCertificates: {
                  type: "number",
                },
                TotalRevokedEntries: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the trust store created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTrustStore;
