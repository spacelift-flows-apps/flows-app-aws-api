import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, GetSAMLProviderCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getSAMLProvider: AppBlock = {
  name: "Get SAML Provider",
  description: `Returns the SAML provider metadocument that was uploaded when the IAM SAML provider resource object was created or updated.`,
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
        SAMLProviderArn: {
          name: "SAML Provider Arn",
          description:
            "The Amazon Resource Name (ARN) of the SAML provider resource object in IAM to get information about.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetSAMLProviderCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get SAML Provider Result",
      description: "Result from GetSAMLProvider operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SAMLProviderUUID: {
            type: "string",
            description: "The unique identifier assigned to the SAML provider.",
          },
          SAMLMetadataDocument: {
            type: "string",
            description:
              "The XML metadata document that includes information about an identity provider.",
          },
          CreateDate: {
            type: "string",
            description:
              "The date and time when the SAML provider was created.",
          },
          ValidUntil: {
            type: "string",
            description: "The expiration date and time for the SAML provider.",
          },
          Tags: {
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
              required: ["Key", "Value"],
              additionalProperties: false,
            },
            description:
              "A list of tags that are attached to the specified IAM SAML provider.",
          },
          AssertionEncryptionMode: {
            type: "string",
            description:
              "Specifies the encryption setting for the SAML provider.",
          },
          PrivateKeyList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                KeyId: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The private key metadata for the SAML provider.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getSAMLProvider;
