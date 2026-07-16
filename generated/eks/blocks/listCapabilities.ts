import { AppBlock, events } from "@slflows/sdk/v1";
import { EKSClient, ListCapabilitiesCommand } from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCapabilities: AppBlock = {
  name: "List Capabilities",
  description: `Lists all managed capabilities in your Amazon EKS cluster.`,
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
        clusterName: {
          name: "cluster Name",
          description:
            "The name of the Amazon EKS cluster for which you want to list capabilities.",
          type: "string",
          required: true,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a previous paginated request, where maxResults was used and the results exceeded the value of that parameter.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of results to return in a single call.",
          type: "number",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListCapabilitiesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Capabilities Result",
      description: "Result from ListCapabilities operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          capabilities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                capabilityName: {
                  type: "string",
                },
                arn: {
                  type: "string",
                },
                type: {
                  type: "string",
                  enum: ["ACK", "KRO", "ARGOCD"],
                },
                status: {
                  type: "string",
                  enum: [
                    "CREATING",
                    "CREATE_FAILED",
                    "UPDATING",
                    "DELETING",
                    "DELETE_FAILED",
                    "ACTIVE",
                    "DEGRADED",
                  ],
                },
                version: {
                  type: "string",
                },
                createdAt: {
                  type: "string",
                },
                modifiedAt: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of capability summary objects, each containing basic information about a capability including its name, ARN, type, status, version, and timestamps.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListCapabilities request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listCapabilities;
