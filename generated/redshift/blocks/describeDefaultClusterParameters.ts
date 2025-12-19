import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeDefaultClusterParametersCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDefaultClusterParameters: AppBlock = {
  name: "Describe Default Cluster Parameters",
  description: `Returns a list of parameter settings for the specified parameter group family.`,
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
        ParameterGroupFamily: {
          name: "Parameter Group Family",
          description: "The name of the cluster parameter group family.",
          type: "string",
          required: true,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional parameter that specifies the starting point to return a set of response records.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDefaultClusterParametersCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Default Cluster Parameters Result",
      description: "Result from DescribeDefaultClusterParameters operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DefaultClusterParameters: {
            type: "object",
            properties: {
              ParameterGroupFamily: {
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
                    DataType: {
                      type: "string",
                    },
                    AllowedValues: {
                      type: "string",
                    },
                    ApplyType: {
                      type: "string",
                    },
                    IsModifiable: {
                      type: "boolean",
                    },
                    MinimumEngineVersion: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Describes the default cluster parameters for a parameter group family.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDefaultClusterParameters;
