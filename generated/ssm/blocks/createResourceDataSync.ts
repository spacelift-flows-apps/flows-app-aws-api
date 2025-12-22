import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateResourceDataSyncCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createResourceDataSync: AppBlock = {
  name: "Create Resource Data Sync",
  description: `A resource data sync helps you view data from multiple sources in a single location.`,
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
          description: "A name for the configuration.",
          type: "string",
          required: true,
        },
        S3Destination: {
          name: "S3Destination",
          description: "Amazon S3 configuration details for the sync.",
          type: {
            type: "object",
            properties: {
              BucketName: {
                type: "string",
              },
              Prefix: {
                type: "string",
              },
              SyncFormat: {
                type: "string",
              },
              Region: {
                type: "string",
              },
              AWSKMSKeyARN: {
                type: "string",
              },
              DestinationDataSharing: {
                type: "object",
                properties: {
                  DestinationDataSharingType: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            required: ["BucketName", "SyncFormat", "Region"],
            additionalProperties: false,
          },
          required: false,
        },
        SyncType: {
          name: "Sync Type",
          description:
            "Specify SyncToDestination to create a resource data sync that synchronizes data to an S3 bucket for Inventory.",
          type: "string",
          required: false,
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
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateResourceDataSyncCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Resource Data Sync Result",
      description: "Result from CreateResourceDataSync operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default createResourceDataSync;
