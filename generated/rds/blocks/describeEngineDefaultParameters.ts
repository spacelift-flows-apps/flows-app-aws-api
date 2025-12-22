import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RDSClient,
  DescribeEngineDefaultParametersCommand,
} from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEngineDefaultParameters: AppBlock = {
  name: "Describe Engine Default Parameters",
  description: `Returns the default engine and system parameter information for the specified database engine.`,
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
        DBParameterGroupFamily: {
          name: "DB Parameter Group Family",
          description: "The name of the DB parameter group family.",
          type: "string",
          required: true,
        },
        Filters: {
          name: "Filters",
          description:
            "A filter that specifies one or more parameters to describe.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous DescribeEngineDefaultParameters request.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEngineDefaultParametersCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Engine Default Parameters Result",
      description: "Result from DescribeEngineDefaultParameters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EngineDefaults: {
            type: "object",
            properties: {
              DBParameterGroupFamily: {
                type: "string",
              },
              Marker: {
                type: "string",
              },
              Parameters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ParameterName: {
                      type: "string",
                    },
                    ParameterValue: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                    Source: {
                      type: "string",
                    },
                    ApplyType: {
                      type: "string",
                    },
                    DataType: {
                      type: "string",
                    },
                    AllowedValues: {
                      type: "string",
                    },
                    IsModifiable: {
                      type: "boolean",
                    },
                    MinimumEngineVersion: {
                      type: "string",
                    },
                    ApplyMethod: {
                      type: "string",
                    },
                    SupportedEngineModes: {
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
            },
            additionalProperties: false,
            description:
              "Contains the result of a successful invocation of the DescribeEngineDefaultParameters action.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEngineDefaultParameters;
