import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, UpdateResourceDataSyncCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateResourceDataSync: AppBlock = {
  name: "Update Resource Data Sync",
  description: `Update a resource data sync.`,
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
        SyncName: {
          name: "Sync Name",
          description: "The name of the resource data sync you want to update.",
          type: "string",
          required: true,
        },
        SyncType: {
          name: "Sync Type",
          description: "The type of resource data sync.",
          type: "string",
          required: true,
        },
        SyncSource: {
          name: "Sync Source",
          description:
            "Specify information about the data sources to synchronize.",
          type: {
            type: "object",
            properties: {
              SourceType: {
                type: "string",
              },
              AwsOrganizationsSource: {
                type: "object",
                properties: {
                  OrganizationSourceType: {
                    type: "string",
                  },
                  OrganizationalUnits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        OrganizationalUnitId: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                },
                required: ["OrganizationSourceType"],
                additionalProperties: false,
              },
              SourceRegions: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              IncludeFutureRegions: {
                type: "boolean",
              },
              EnableAllOpsDataSources: {
                type: "boolean",
              },
            },
            required: ["SourceType", "SourceRegions"],
            additionalProperties: false,
          },
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateResourceDataSyncCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Resource Data Sync Result",
      description: "Result from UpdateResourceDataSync operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default updateResourceDataSync;
