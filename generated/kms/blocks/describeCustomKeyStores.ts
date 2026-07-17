import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, DescribeCustomKeyStoresCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCustomKeyStores: AppBlock = {
  name: "Describe Custom Key Stores",
  description: `Gets information about custom key stores in the account and Region.`,
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
        CustomKeyStoreId: {
          name: "Custom Key Store Id",
          description:
            "Gets only information about the specified custom key store.",
          type: "string",
          required: false,
        },
        CustomKeyStoreName: {
          name: "Custom Key Store Name",
          description:
            "Gets only information about the specified custom key store.",
          type: "string",
          required: false,
        },
        Limit: {
          name: "Limit",
          description:
            "Use this parameter to specify the maximum number of items to return.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this parameter in a subsequent request after you receive a response with truncated results.",
          type: "string",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeCustomKeyStoresCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Custom Key Stores Result",
      description: "Result from DescribeCustomKeyStores operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CustomKeyStores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CustomKeyStoreId: {
                  type: "string",
                },
                CustomKeyStoreName: {
                  type: "string",
                },
                CloudHsmClusterId: {
                  type: "string",
                },
                TrustAnchorCertificate: {
                  type: "string",
                },
                ConnectionState: {
                  type: "string",
                  enum: [
                    "CONNECTED",
                    "CONNECTING",
                    "FAILED",
                    "DISCONNECTED",
                    "DISCONNECTING",
                  ],
                },
                ConnectionErrorCode: {
                  type: "string",
                  enum: [
                    "INVALID_CREDENTIALS",
                    "CLUSTER_NOT_FOUND",
                    "NETWORK_ERRORS",
                    "INTERNAL_ERROR",
                    "INSUFFICIENT_CLOUDHSM_HSMS",
                    "USER_LOCKED_OUT",
                    "USER_NOT_FOUND",
                    "USER_LOGGED_IN",
                    "SUBNET_NOT_FOUND",
                    "INSUFFICIENT_FREE_ADDRESSES_IN_SUBNET",
                    "XKS_PROXY_ACCESS_DENIED",
                    "XKS_PROXY_NOT_REACHABLE",
                    "XKS_VPC_ENDPOINT_SERVICE_NOT_FOUND",
                    "XKS_PROXY_INVALID_RESPONSE",
                    "XKS_PROXY_INVALID_CONFIGURATION",
                    "XKS_VPC_ENDPOINT_SERVICE_INVALID_CONFIGURATION",
                    "XKS_PROXY_TIMED_OUT",
                    "XKS_PROXY_INVALID_TLS_CONFIGURATION",
                  ],
                },
                CreationDate: {
                  type: "string",
                },
                CustomKeyStoreType: {
                  type: "string",
                  enum: ["AWS_CLOUDHSM", "EXTERNAL_KEY_STORE"],
                },
                XksProxyConfiguration: {
                  type: "object",
                  properties: {
                    Connectivity: {
                      type: "string",
                      enum: ["PUBLIC_ENDPOINT", "VPC_ENDPOINT_SERVICE"],
                    },
                    AccessKeyId: {
                      type: "string",
                    },
                    UriEndpoint: {
                      type: "string",
                    },
                    UriPath: {
                      type: "string",
                    },
                    VpcEndpointServiceName: {
                      type: "string",
                    },
                    VpcEndpointServiceOwner: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Contains metadata about each custom key store.",
          },
          NextMarker: {
            type: "string",
            description:
              "When Truncated is true, this element is present and contains the value to use for the Marker parameter in a subsequent request.",
          },
          Truncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more items in the list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCustomKeyStores;
