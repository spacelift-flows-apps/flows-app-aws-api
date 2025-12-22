import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeInstanceConnectEndpointsCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstanceConnectEndpoints: AppBlock = {
  name: "Describe Instance Connect Endpoints",
  description: `Describes the specified EC2 Instance Connect Endpoints or all EC2 Instance Connect Endpoints.`,
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token returned from a previous paginated request.",
          type: "string",
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
        InstanceConnectEndpointIds: {
          name: "Instance Connect Endpoint Ids",
          description: "One or more EC2 Instance Connect Endpoint IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new DescribeInstanceConnectEndpointsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Connect Endpoints Result",
      description: "Result from DescribeInstanceConnectEndpoints operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceConnectEndpoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                OwnerId: {
                  type: "string",
                },
                InstanceConnectEndpointId: {
                  type: "string",
                },
                InstanceConnectEndpointArn: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                StateMessage: {
                  type: "string",
                },
                DnsName: {
                  type: "string",
                },
                FipsDnsName: {
                  type: "string",
                },
                NetworkInterfaceIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                VpcId: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                CreatedAt: {
                  type: "string",
                },
                SubnetId: {
                  type: "string",
                },
                PreserveClientIp: {
                  type: "boolean",
                },
                SecurityGroupIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
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
                IpAddressType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the EC2 Instance Connect Endpoints.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstanceConnectEndpoints;
