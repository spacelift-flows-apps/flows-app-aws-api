import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getParametersByPath: AppBlock = {
  name: "Get Parameters By Path",
  description: `Retrieve information about one or more parameters under a specified level in a hierarchy.`,
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
        Path: {
          name: "Path",
          description: "The hierarchy for the parameter.",
          type: "string",
          required: true,
        },
        Recursive: {
          name: "Recursive",
          description: "Retrieve all parameters within a hierarchy.",
          type: "boolean",
          required: false,
        },
        ParameterFilters: {
          name: "Parameter Filters",
          description: "Filters to limit the request results.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Option: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        WithDecryption: {
          name: "With Decryption",
          description:
            "Retrieve all parameters in a hierarchy with their value decrypted.",
          type: "boolean",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetParametersByPathCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Parameters By Path Result",
      description: "Result from GetParametersByPath operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Parameters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
                Version: {
                  type: "number",
                },
                Selector: {
                  type: "string",
                },
                SourceResult: {
                  type: "string",
                },
                LastModifiedDate: {
                  type: "string",
                },
                ARN: {
                  type: "string",
                },
                DataType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of parameters found in the specified hierarchy.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getParametersByPath;
