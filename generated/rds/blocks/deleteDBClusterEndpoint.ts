import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DeleteDBClusterEndpointCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteDBClusterEndpoint: AppBlock = {
  name: "Delete DB Cluster Endpoint",
  description: `Deletes a custom endpoint and removes it from an Amazon Aurora DB cluster.`,
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
        DBClusterEndpointIdentifier: {
          name: "DB Cluster Endpoint Identifier",
          description: "The identifier associated with the custom endpoint.",
          type: "string",
          required: true,
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

        const command = new DeleteDBClusterEndpointCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete DB Cluster Endpoint Result",
      description: "Result from DeleteDBClusterEndpoint operation",
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

export default deleteDBClusterEndpoint;
