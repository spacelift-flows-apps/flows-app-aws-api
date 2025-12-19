import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ECRClient,
  PutRegistryScanningConfigurationCommand,
} from "@aws-sdk/client-ecr";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putRegistryScanningConfiguration: AppBlock = {
  name: "Put Registry Scanning Configuration",
  description: `Creates or updates the scanning configuration for your private registry.`,
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
        scanType: {
          name: "scan Type",
          description: "The scanning type to set for the registry.",
          type: "string",
          required: false,
        },
        rules: {
          name: "rules",
          description: "The scanning rules to use for the registry.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scanFrequency: {
                  type: "string",
                },
                repositoryFilters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      filter: {
                        type: "object",
                        additionalProperties: true,
                      },
                      filterType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["filter", "filterType"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["scanFrequency", "repositoryFilters"],
              additionalProperties: false,
            },
          },
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

        const client = new ECRClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutRegistryScanningConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Registry Scanning Configuration Result",
      description: "Result from PutRegistryScanningConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          registryScanningConfiguration: {
            type: "object",
            properties: {
              scanType: {
                type: "string",
              },
              rules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    scanFrequency: {
                      type: "string",
                    },
                    repositoryFilters: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["scanFrequency", "repositoryFilters"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description: "The scanning configuration for your registry.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putRegistryScanningConfiguration;
