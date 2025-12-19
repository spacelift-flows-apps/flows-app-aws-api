import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeEndpointAuthorizationCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEndpointAuthorization: AppBlock = {
  name: "Describe Endpoint Authorization",
  description: `Describes an endpoint authorization.`,
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
          description: "The cluster identifier of the cluster to access.",
          type: "string",
          required: false,
        },
        Account: {
          name: "Account",
          description:
            "The Amazon Web Services account ID of either the cluster owner (grantor) or grantee.",
          type: "string",
          required: false,
        },
        Grantee: {
          name: "Grantee",
          description:
            "Indicates whether to check authorization from a grantor or grantee point of view.",
          type: "boolean",
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
            "An optional pagination token provided by a previous DescribeEndpointAuthorization request.",
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

        const command = new DescribeEndpointAuthorizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Endpoint Authorization Result",
      description: "Result from DescribeEndpointAuthorization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EndpointAuthorizationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Grantor: {
                  type: "string",
                },
                Grantee: {
                  type: "string",
                },
                ClusterIdentifier: {
                  type: "string",
                },
                AuthorizeTime: {
                  type: "string",
                },
                ClusterStatus: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                AllowedAllVPCs: {
                  type: "boolean",
                },
                AllowedVPCs: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                EndpointCount: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The authorizations to an endpoint.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous DescribeEndpointAuthorization request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEndpointAuthorization;
