import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateClusterSubnetGroupCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createClusterSubnetGroup: AppBlock = {
  name: "Create Cluster Subnet Group",
  description: `Creates a new Amazon Redshift subnet group.`,
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
        ClusterSubnetGroupName: {
          name: "Cluster Subnet Group Name",
          description: "The name for the subnet group.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A description for the subnet group.",
          type: "string",
          required: true,
        },
        SubnetIds: {
          name: "Subnet Ids",
          description: "An array of VPC subnet IDs.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
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

        const command = new CreateClusterSubnetGroupCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Cluster Subnet Group Result",
      description: "Result from CreateClusterSubnetGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClusterSubnetGroup: {
            type: "object",
            properties: {
              ClusterSubnetGroupName: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              VpcId: {
                type: "string",
              },
              SubnetGroupStatus: {
                type: "string",
              },
              Subnets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    SubnetIdentifier: {
                      type: "string",
                    },
                    SubnetAvailabilityZone: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SupportedPlatforms: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    SubnetStatus: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              SupportedClusterIpAddressTypes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "Describes a subnet group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createClusterSubnetGroup;
