import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, CreateCustomKeyStoreCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createCustomKeyStore: AppBlock = {
  name: "Create Custom Key Store",
  description: `Creates a custom key store backed by a key store that you own and manage.`,
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
        CustomKeyStoreName: {
          name: "Custom Key Store Name",
          description: "Specifies a friendly name for the custom key store.",
          type: "string",
          required: true,
        },
        CloudHsmClusterId: {
          name: "Cloud Hsm Cluster Id",
          description:
            "Identifies the CloudHSM cluster for an CloudHSM key store.",
          type: "string",
          required: false,
        },
        TrustAnchorCertificate: {
          name: "Trust Anchor Certificate",
          description: "Specifies the certificate for an CloudHSM key store.",
          type: "string",
          required: false,
        },
        KeyStorePassword: {
          name: "Key Store Password",
          description:
            "Specifies the kmsuser password for an CloudHSM key store.",
          type: "string",
          required: false,
        },
        CustomKeyStoreType: {
          name: "Custom Key Store Type",
          description: "Specifies the type of custom key store.",
          type: "string",
          required: false,
        },
        XksProxyUriEndpoint: {
          name: "Xks Proxy Uri Endpoint",
          description:
            "Specifies the endpoint that KMS uses to send requests to the external key store proxy (XKS proxy).",
          type: "string",
          required: false,
        },
        XksProxyUriPath: {
          name: "Xks Proxy Uri Path",
          description:
            "Specifies the base path to the proxy APIs for this external key store.",
          type: "string",
          required: false,
        },
        XksProxyVpcEndpointServiceName: {
          name: "Xks Proxy Vpc Endpoint Service Name",
          description:
            "Specifies the name of the Amazon VPC endpoint service for interface endpoints that is used to communicate with your external key store proxy (XKS proxy).",
          type: "string",
          required: false,
        },
        XksProxyAuthenticationCredential: {
          name: "Xks Proxy Authentication Credential",
          description:
            "Specifies an authentication credential for the external key store proxy (XKS proxy).",
          type: {
            type: "object",
            properties: {
              AccessKeyId: {
                type: "string",
              },
              RawSecretAccessKey: {
                type: "string",
              },
            },
            required: ["AccessKeyId", "RawSecretAccessKey"],
            additionalProperties: false,
          },
          required: false,
        },
        XksProxyConnectivity: {
          name: "Xks Proxy Connectivity",
          description:
            "Indicates how KMS communicates with the external key store proxy.",
          type: "string",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateCustomKeyStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Custom Key Store Result",
      description: "Result from CreateCustomKeyStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CustomKeyStoreId: {
            type: "string",
            description: "A unique identifier for the new custom key store.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createCustomKeyStore;
