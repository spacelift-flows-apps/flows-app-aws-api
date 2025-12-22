import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CreateDBClusterEndpointCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createDBClusterEndpoint: AppBlock = {
  name: "Create DB Cluster Endpoint",
  description: `Creates a new custom endpoint and associates it with an Amazon Aurora DB cluster.`,
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
        DBClusterIdentifier: {
          name: "DB Cluster Identifier",
          description:
            "The DB cluster identifier of the DB cluster associated with the endpoint.",
          type: "string",
          required: true,
        },
        DBClusterEndpointIdentifier: {
          name: "DB Cluster Endpoint Identifier",
          description: "The identifier to use for the new endpoint.",
          type: "string",
          required: true,
        },
        EndpointType: {
          name: "Endpoint Type",
          description: "The type of the endpoint, one of: READER, WRITER, ANY.",
          type: "string",
          required: true,
        },
        StaticMembers: {
          name: "Static Members",
          description:
            "List of DB instance identifiers that are part of the custom endpoint group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ExcludedMembers: {
          name: "Excluded Members",
          description:
            "List of DB instance identifiers that aren't part of the custom endpoint group.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "The tags to be assigned to the Amazon RDS resource.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateDBClusterEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create DB Cluster Endpoint Result",
      description: "Result from CreateDBClusterEndpoint operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBClusterEndpointIdentifier: {
            type: "string",
            description: "The identifier associated with the endpoint.",
          },
          DBClusterIdentifier: {
            type: "string",
            description:
              "The DB cluster identifier of the DB cluster associated with the endpoint.",
          },
          DBClusterEndpointResourceIdentifier: {
            type: "string",
            description:
              "A unique system-generated identifier for an endpoint.",
          },
          Endpoint: {
            type: "string",
            description: "The DNS address of the endpoint.",
          },
          Status: {
            type: "string",
            description: "The current status of the endpoint.",
          },
          EndpointType: {
            type: "string",
            description: "The type of the endpoint.",
          },
          CustomEndpointType: {
            type: "string",
            description: "The type associated with a custom endpoint.",
          },
          StaticMembers: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of DB instance identifiers that are part of the custom endpoint group.",
          },
          ExcludedMembers: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of DB instance identifiers that aren't part of the custom endpoint group.",
          },
          DBClusterEndpointArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) for the endpoint.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createDBClusterEndpoint;
