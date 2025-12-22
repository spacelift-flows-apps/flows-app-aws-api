import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInstancePropertiesCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceProperties: AppBlock = {
  name: "Describe Instance Properties",
  description: `An API operation used by the Systems Manager console to display information about Systems Manager managed nodes.`,
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
        InstancePropertyFilterList: {
          name: "Instance Property Filter List",
          description: "An array of instance property filters.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                },
                valueSet: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["key", "valueSet"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        FiltersWithOperator: {
          name: "Filters With Operator",
          description: "The request filters to use with the operator.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Operator: {
                  type: "string",
                },
              },
              required: ["Key", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for the call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token provided by a previous request to use to return the next set of properties.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeInstancePropertiesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Properties Result",
      description: "Result from DescribeInstanceProperties operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceProperties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                InstanceId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                InstanceRole: {
                  type: "string",
                },
                KeyName: {
                  type: "string",
                },
                InstanceState: {
                  type: "string",
                },
                Architecture: {
                  type: "string",
                },
                IPAddress: {
                  type: "string",
                },
                LaunchTime: {
                  type: "string",
                },
                PingStatus: {
                  type: "string",
                },
                LastPingDateTime: {
                  type: "string",
                },
                AgentVersion: {
                  type: "string",
                },
                PlatformType: {
                  type: "string",
                },
                PlatformName: {
                  type: "string",
                },
                PlatformVersion: {
                  type: "string",
                },
                ActivationId: {
                  type: "string",
                },
                IamRole: {
                  type: "string",
                },
                RegistrationDate: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                ComputerName: {
                  type: "string",
                },
                AssociationStatus: {
                  type: "string",
                },
                LastAssociationExecutionDate: {
                  type: "string",
                },
                LastSuccessfulAssociationExecutionDate: {
                  type: "string",
                },
                AssociationOverview: {
                  type: "object",
                  properties: {
                    DetailedStatus: {
                      type: "string",
                    },
                    InstanceAssociationStatusAggregatedCount: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                  },
                  additionalProperties: false,
                },
                SourceId: {
                  type: "string",
                },
                SourceType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Properties for the managed instances.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of properties to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceProperties;
