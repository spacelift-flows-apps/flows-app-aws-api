import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListFunctionsCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listFunctions: AppBlock = {
  name: "List Functions",
  description: `Gets a list of all CloudFront functions in your Amazon Web Services account.`,
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
            "Use this field when paginating results to indicate where to begin in your list of functions.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of functions that you want in the response.",
          type: "number",
          required: false,
        },
        Stage: {
          name: "Stage",
          description:
            "An optional filter to return only the functions that are in the specified stage, either DEVELOPMENT or LIVE.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListFunctionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Functions Result",
      description: "Result from ListFunctions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          FunctionList: {
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
                    Name: {
                      type: "string",
                    },
                    Status: {
                      type: "string",
                    },
                    FunctionConfig: {
                      type: "object",
                      properties: {
                        Comment: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Runtime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyValueStoreAssociations: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Comment", "Runtime"],
                      additionalProperties: false,
                    },
                    FunctionMetadata: {
                      type: "object",
                      properties: {
                        FunctionARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Stage: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CreatedTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                        LastModifiedTime: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["FunctionARN", "LastModifiedTime"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Name", "FunctionConfig", "FunctionMetadata"],
                  additionalProperties: false,
                },
              },
            },
            required: ["MaxItems", "Quantity"],
            additionalProperties: false,
            description: "A list of CloudFront functions.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listFunctions;
