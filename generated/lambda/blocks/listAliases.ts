import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, ListAliasesCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAliases: AppBlock = {
  name: "List Aliases",
  description: `Returns a list of aliases for a Lambda function.`,
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
        FunctionName: {
          name: "Function Name",
          description: "The name or ARN of the Lambda function.",
          type: "string",
          required: true,
        },
        FunctionVersion: {
          name: "Function Version",
          description:
            "Specify a function version to only list aliases that invoke that version.",
          type: "string",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Specify the pagination token that's returned by a previous request to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description: "Limit the number of aliases returned.",
          type: "number",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListAliasesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Aliases Result",
      description: "Result from ListAliases operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "The pagination token that's included if more results are available.",
          },
          Aliases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AliasArn: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                FunctionVersion: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                RoutingConfig: {
                  type: "object",
                  properties: {
                    AdditionalVersionWeights: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                RevisionId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of aliases.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listAliases;
