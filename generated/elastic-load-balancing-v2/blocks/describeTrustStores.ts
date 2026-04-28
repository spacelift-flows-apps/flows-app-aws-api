import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  DescribeTrustStoresCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTrustStores: AppBlock = {
  name: "Describe Trust Stores",
  description: `Describes all trust stores for the specified account.`,
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
        TrustStoreArns: {
          name: "Trust Store Arns",
          description: "The Amazon Resource Name (ARN) of the trust store.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Names: {
          name: "Names",
          description: "The names of the trust stores.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        PageSize: {
          name: "Page Size",
          description:
            "The maximum number of results to return with this call.",
          type: "number",
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

        const command = new DescribeTrustStoresCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Trust Stores Result",
      description: "Result from DescribeTrustStores operation",
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
            description: "Information about the trust stores.",
          },
          NextMarker: {
            type: "string",
            description:
              "If there are additional results, this is the marker for the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTrustStores;
