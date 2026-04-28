import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  AddListenerCertificatesCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const addListenerCertificates: AppBlock = {
  name: "Add Listener Certificates",
  description: `Adds the specified SSL server certificate to the certificate list for the specified HTTPS or TLS listener.`,
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
        ListenerArn: {
          name: "Listener Arn",
          description: "The Amazon Resource Name (ARN) of the listener.",
          type: "string",
          required: true,
        },
        Certificates: {
          name: "Certificates",
          description: "The certificate to add.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CertificateArn: {
                  type: "string",
                },
                IsDefault: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
          },
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AddListenerCertificatesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Add Listener Certificates Result",
      description: "Result from AddListenerCertificates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Certificates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CertificateArn: {
                  type: "string",
                },
                IsDefault: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the certificates in the certificate list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default addListenerCertificates;
