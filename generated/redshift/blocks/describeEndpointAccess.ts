import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeEndpointAccessCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEndpointAccess: AppBlock = {
  name: "Describe Endpoint Access",
  description: `Describes a Redshift-managed VPC endpoint.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The cluster identifier associated with the described endpoint.",
          type: "string",
          required: false,
        },
        ResourceOwner: {
          name: "Resource Owner",
          description:
            "The Amazon Web Services account ID of the owner of the cluster.",
          type: "string",
          required: false,
        },
        EndpointName: {
          name: "Endpoint Name",
          description: "The name of the endpoint to be described.",
          type: "string",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description:
            "The virtual private cloud (VPC) identifier with access to the cluster.",
          type: "string",
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
            "An optional pagination token provided by a previous DescribeEndpointAccess request.",
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

        const command = new DescribeEndpointAccessCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Endpoint Access Result",
      description: "Result from DescribeEndpointAccess operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EndpointAccessList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ClusterIdentifier: {
                  type: "string",
                },
                ResourceOwner: {
                  type: "string",
                },
                SubnetGroupName: {
                  type: "string",
                },
                EndpointStatus: {
                  type: "string",
                },
                EndpointName: {
                  type: "string",
                },
                EndpointCreateTime: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                Address: {
                  type: "string",
                },
                VpcSecurityGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      VpcSecurityGroupId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                VpcEndpoint: {
                  type: "object",
                  properties: {
                    VpcEndpointId: {
                      type: "string",
                    },
                    VpcId: {
                      type: "string",
                    },
                    NetworkInterfaces: {
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
              additionalProperties: false,
            },
            description: "The list of endpoints with access to the cluster.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous DescribeEndpointAccess request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEndpointAccess;
