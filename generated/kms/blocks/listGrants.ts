import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ListGrantsCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listGrants: AppBlock = {
  name: "List Grants",
  description: `Gets a list of all grants for the specified KMS key.`,
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
        KeyId: {
          name: "Key Id",
          description: "Returns only grants for the specified KMS key.",
          type: "string",
          required: true,
        },
        GrantId: {
          name: "Grant Id",
          description: "Returns only the grant with the specified grant ID.",
          type: "string",
          required: false,
        },
        GranteePrincipal: {
          name: "Grantee Principal",
          description:
            "Returns only grants where the specified principal is the grantee principal for the grant.",
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

        const command = new ListGrantsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Grants Result",
      description: "Result from ListGrants operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Grants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                KeyId: {
                  type: "string",
                },
                GrantId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                GranteePrincipal: {
                  type: "string",
                },
                RetiringPrincipal: {
                  type: "string",
                },
                IssuingAccount: {
                  type: "string",
                },
                Operations: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Constraints: {
                  type: "object",
                  properties: {
                    EncryptionContextSubset: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    EncryptionContextEquals: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "A list of grants.",
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

export default listGrants;
