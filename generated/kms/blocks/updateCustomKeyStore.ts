import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, UpdateCustomKeyStoreCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateCustomKeyStore: AppBlock = {
  name: "Update Custom Key Store",
  description: `Changes the properties of a custom key store.`,
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
            "Identifies the custom key store that you want to update.",
          type: "string",
          required: true,
        },
        NewCustomKeyStoreName: {
          name: "New Custom Key Store Name",
          description:
            "Changes the friendly name of the custom key store to the value that you specify.",
          type: "string",
          required: false,
        },
        KeyStorePassword: {
          name: "Key Store Password",
          description:
            "Enter the current password of the kmsuser crypto user (CU) in the CloudHSM cluster that is associated with the custom key store.",
          type: "string",
          required: false,
        },
        CloudHsmClusterId: {
          name: "Cloud Hsm Cluster Id",
          description:
            "Associates the custom key store with a related CloudHSM cluster.",
          type: "string",
          required: false,
        },
        XksProxyUriEndpoint: {
          name: "Xks Proxy Uri Endpoint",
          description:
            "Changes the URI endpoint that KMS uses to connect to your external key store proxy (XKS proxy).",
          type: "string",
          required: false,
        },
        XksProxyUriPath: {
          name: "Xks Proxy Uri Path",
          description:
            "Changes the base path to the proxy APIs for this external key store.",
          type: "string",
          required: false,
        },
        XksProxyVpcEndpointServiceName: {
          name: "Xks Proxy Vpc Endpoint Service Name",
          description:
            "Changes the name that KMS uses to identify the Amazon VPC endpoint service for your external key store proxy (XKS proxy).",
          type: "string",
          required: false,
        },
        XksProxyAuthenticationCredential: {
          name: "Xks Proxy Authentication Credential",
          description:
            "Changes the credentials that KMS uses to sign requests to the external key store proxy (XKS proxy).",
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
            "Changes the connectivity setting for the external key store.",
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
        }

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateCustomKeyStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Custom Key Store Result",
      description: "Result from UpdateCustomKeyStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default updateCustomKeyStore;
