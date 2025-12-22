import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DescribeHostsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeHosts: AppBlock = {
  name: "Describe Hosts",
  description: `Describes the specified Dedicated Hosts or all your Dedicated Hosts.`,
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
        HostIds: {
          name: "Host Ids",
          description: "The IDs of the Dedicated Hosts.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token to use to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to return for the request in a single page.",
          type: "number",
          required: false,
        },
        Filter: {
          name: "Filter",
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

        const command = new DescribeHostsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Hosts Result",
      description: "Result from DescribeHosts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Hosts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AutoPlacement: {
                  type: "string",
                },
                AvailabilityZone: {
                  type: "string",
                },
                AvailableCapacity: {
                  type: "object",
                  properties: {
                    AvailableInstanceCapacity: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    AvailableVCpus: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                ClientToken: {
                  type: "string",
                },
                HostId: {
                  type: "string",
                },
                HostProperties: {
                  type: "object",
                  properties: {
                    Cores: {
                      type: "number",
                    },
                    InstanceType: {
                      type: "string",
                    },
                    InstanceFamily: {
                      type: "string",
                    },
                    Sockets: {
                      type: "number",
                    },
                    TotalVCpus: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
                HostReservationId: {
                  type: "string",
                },
                Instances: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      InstanceId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      OwnerId: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                State: {
                  type: "string",
                },
                AllocationTime: {
                  type: "string",
                },
                ReleaseTime: {
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
                HostRecovery: {
                  type: "string",
                },
                AllowsMultipleInstanceTypes: {
                  type: "string",
                },
                OwnerId: {
                  type: "string",
                },
                AvailabilityZoneId: {
                  type: "string",
                },
                MemberOfServiceLinkedResourceGroup: {
                  type: "boolean",
                },
                OutpostArn: {
                  type: "string",
                },
                HostMaintenance: {
                  type: "string",
                },
                AssetId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the Dedicated Hosts.",
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

export default describeHosts;
