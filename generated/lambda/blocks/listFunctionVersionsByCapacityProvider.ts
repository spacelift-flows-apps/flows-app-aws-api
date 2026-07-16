import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  ListFunctionVersionsByCapacityProviderCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listFunctionVersionsByCapacityProvider: AppBlock = {
  name: "List Function Versions By Capacity Provider",
  description: `Returns a list of function versions that are configured to use a specific capacity provider.`,
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
        CapacityProviderName: {
          name: "Capacity Provider Name",
          description:
            "The name of the capacity provider to list function versions for.",
          type: "string",
          required: true,
        },
        Marker: {
          name: "Marker",
          description:
            "Specify the pagination token that's returned by a previous request to retrieve the next page of results.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of function versions to return in the response.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListFunctionVersionsByCapacityProviderCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Function Versions By Capacity Provider Result",
      description:
        "Result from ListFunctionVersionsByCapacityProvider operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityProviderArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the capacity provider.",
          },
          FunctionVersions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                FunctionArn: {
                  type: "string",
                },
                State: {
                  type: "string",
                  enum: [
                    "Pending",
                    "Active",
                    "Inactive",
                    "Failed",
                    "Deactivating",
                    "Deactivated",
                    "ActiveNonInvocable",
                    "Deleting",
                  ],
                },
              },
              required: ["FunctionArn", "State"],
              additionalProperties: false,
            },
            description:
              "A list of function versions that use the specified capacity provider.",
          },
          NextMarker: {
            type: "string",
            description:
              "The pagination token that's included if more results are available.",
          },
        },
        required: ["CapacityProviderArn", "FunctionVersions"],
      },
    },
  },
};

export default listFunctionVersionsByCapacityProvider;
