import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, ListLayersCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listLayers: AppBlock = {
  name: "List Layers",
  description: `Lists Lambda layers and shows information about the latest version of each.`,
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
        CompatibleRuntime: {
          name: "Compatible Runtime",
          description: "A runtime identifier.",
          type: "string",
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "A pagination token returned by a previous call.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description: "The maximum number of layers to return.",
          type: "number",
          required: false,
        },
        CompatibleArchitecture: {
          name: "Compatible Architecture",
          description: "The compatible instruction set architecture.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListLayersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Layers Result",
      description: "Result from ListLayers operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "A pagination token returned when the response doesn't contain all layers.",
          },
          Layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LayerName: {
                  type: "string",
                },
                LayerArn: {
                  type: "string",
                },
                LatestMatchingVersion: {
                  type: "object",
                  properties: {
                    LayerVersionArn: {
                      type: "string",
                    },
                    Version: {
                      type: "number",
                    },
                    Description: {
                      type: "string",
                    },
                    CreatedDate: {
                      type: "string",
                    },
                    CompatibleRuntimes: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    LicenseInfo: {
                      type: "string",
                    },
                    CompatibleArchitectures: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "A list of function layers.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listLayers;
