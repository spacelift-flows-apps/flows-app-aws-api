import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInstanceInformationCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceInformation: AppBlock = {
  name: "Describe Instance Information",
  description: `Provides information about one or more of your managed nodes, including the operating system platform, SSM Agent version, association status, and IP address.`,
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
        InstanceInformationFilterList: {
          name: "Instance Information Filter List",
          description: "This is a legacy method.",
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
        Filters: {
          name: "Filters",
          description: "One or more filters.",
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
              },
              required: ["Key", "Values"],
              additionalProperties: false,
            },
          },
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
          description: "The token for the next set of items to return.",
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

        const command = new DescribeInstanceInformationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Information Result",
      description: "Result from DescribeInstanceInformation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceInformationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceId: {
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
                IsLatestVersion: {
                  type: "boolean",
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
                Name: {
                  type: "string",
                },
                IPAddress: {
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
            description: "The managed node information list.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceInformation;
