import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeVpcEndpointServiceConfigurationsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeVpcEndpointServiceConfigurations: AppBlock = {
  name: "Describe Vpc Endpoint Service Configurations",
  description: `Describes the VPC endpoint service configurations in your account (your services).`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ServiceIds: {
          name: "Service Ids",
          description: "The IDs of the endpoint services.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "The filters.",
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
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return for the request in a single page.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token to retrieve the next page of results.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeVpcEndpointServiceConfigurationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Vpc Endpoint Service Configurations Result",
      description:
        "Result from DescribeVpcEndpointServiceConfigurations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServiceConfigurations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ServiceType: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ServiceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ServiceId: {
                  type: "string",
                },
                ServiceName: {
                  type: "string",
                },
                ServiceState: {
                  type: "string",
                },
                AvailabilityZones: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                AcceptanceRequired: {
                  type: "boolean",
                },
                ManagesVpcEndpoints: {
                  type: "boolean",
                },
                NetworkLoadBalancerArns: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                GatewayLoadBalancerArns: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                SupportedIpAddressTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                BaseEndpointDnsNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                PrivateDnsName: {
                  type: "string",
                },
                PrivateDnsNameConfiguration: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    Type: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                    Name: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                PayerResponsibility: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SupportedRegions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Region: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ServiceState: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                RemoteAccessEnabled: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the services.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use to retrieve the next page of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeVpcEndpointServiceConfigurations;
