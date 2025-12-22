import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  CreateKeySigningKeyCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createKeySigningKey: AppBlock = {
  name: "Create Key Signing Key",
  description: `Creates a new key-signing key (KSK) associated with a hosted zone.`,
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
        CallerReference: {
          name: "Caller Reference",
          description: "A unique string that identifies the request.",
          type: "string",
          required: true,
        },
        HostedZoneId: {
          name: "Hosted Zone Id",
          description: "The unique string (ID) used to identify a hosted zone.",
          type: "string",
          required: true,
        },
        KeyManagementServiceArn: {
          name: "Key Management Service Arn",
          description:
            "The Amazon resource name (ARN) for a customer managed key in Key Management Service (KMS).",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "A string used to identify a key-signing key (KSK).",
          type: "string",
          required: true,
        },
        Status: {
          name: "Status",
          description:
            "A string specifying the initial status of the key-signing key (KSK).",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateKeySigningKeyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Key Signing Key Result",
      description: "Result from CreateKeySigningKey operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChangeInfo: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              SubmittedAt: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
            },
            required: ["Id", "Status", "SubmittedAt"],
            additionalProperties: false,
            description:
              "A complex type that describes change information about changes made to your hosted zone.",
          },
          KeySigningKey: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              KmsArn: {
                type: "string",
              },
              Flag: {
                type: "number",
              },
              SigningAlgorithmMnemonic: {
                type: "string",
              },
              SigningAlgorithmType: {
                type: "number",
              },
              DigestAlgorithmMnemonic: {
                type: "string",
              },
              DigestAlgorithmType: {
                type: "number",
              },
              KeyTag: {
                type: "number",
              },
              DigestValue: {
                type: "string",
              },
              PublicKey: {
                type: "string",
              },
              DSRecord: {
                type: "string",
              },
              DNSKEYRecord: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              StatusMessage: {
                type: "string",
              },
              CreatedDate: {
                type: "string",
              },
              LastModifiedDate: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The key-signing key (KSK) that the request creates.",
          },
          Location: {
            type: "string",
            description:
              "The unique URL representing the new key-signing key (KSK).",
          },
        },
        required: ["ChangeInfo", "KeySigningKey", "Location"],
      },
    },
  },
};

export default createKeySigningKey;
