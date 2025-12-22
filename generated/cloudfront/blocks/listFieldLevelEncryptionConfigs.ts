import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListFieldLevelEncryptionConfigsCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listFieldLevelEncryptionConfigs: AppBlock = {
  name: "List Field Level Encryption Configs",
  description: `List all field-level encryption configurations that have been created in CloudFront for this account.`,
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
        Marker: {
          name: "Marker",
          description:
            "Use this when paginating results to indicate where to begin in your list of configurations.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of field-level encryption configurations you want in the response body.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListFieldLevelEncryptionConfigsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Field Level Encryption Configs Result",
      description: "Result from ListFieldLevelEncryptionConfigs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FieldLevelEncryptionList: {
            type: "object",
            properties: {
              NextMarker: {
                type: "string",
              },
              MaxItems: {
                type: "number",
              },
              Quantity: {
                type: "number",
              },
              Items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Id: {
                      type: "string",
                    },
                    LastModifiedTime: {
                      type: "string",
                    },
                    Comment: {
                      type: "string",
                    },
                    QueryArgProfileConfig: {
                      type: "object",
                      properties: {
                        ForwardWhenQueryArgProfileIsUnknown: {
                          type: "object",
                          additionalProperties: true,
                        },
                        QueryArgProfiles: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ForwardWhenQueryArgProfileIsUnknown"],
                      additionalProperties: false,
                    },
                    ContentTypeProfileConfig: {
                      type: "object",
                      properties: {
                        ForwardWhenContentTypeIsUnknown: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ContentTypeProfiles: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["ForwardWhenContentTypeIsUnknown"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Id", "LastModifiedTime"],
                  additionalProperties: false,
                },
              },
            },
            required: ["MaxItems", "Quantity"],
            additionalProperties: false,
            description:
              "Returns a list of all field-level encryption configurations that have been created in CloudFront for this account.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listFieldLevelEncryptionConfigs;
