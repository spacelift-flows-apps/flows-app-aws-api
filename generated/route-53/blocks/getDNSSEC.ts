import { AppBlock, events } from "@slflows/sdk/v1";
import { Route53Client, GetDNSSECCommand } from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDNSSEC: AppBlock = {
  name: "Get DNSSEC",
  description: `Returns information about DNSSEC for a specific hosted zone, including the key-signing keys (KSKs) in the hosted zone.`,
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
        HostedZoneId: {
          name: "Hosted Zone Id",
          description: "A unique string used to identify a hosted zone.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDNSSECCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get DNSSEC Result",
      description: "Result from GetDNSSEC operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Status: {
            type: "object",
            properties: {
              ServeSignature: {
                type: "string",
              },
              StatusMessage: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "A string representing the status of DNSSEC.",
          },
          KeySigningKeys: {
            type: "array",
            items: {
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
            },
            description: "The key-signing keys (KSKs) in your account.",
          },
        },
        required: ["Status", "KeySigningKeys"],
      },
    },
  },
};

export default getDNSSEC;
