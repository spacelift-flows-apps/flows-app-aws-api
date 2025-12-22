import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  GetEventDataStoreCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getEventDataStore: AppBlock = {
  name: "Get Event Data Store",
  description: `Returns information about an event data store specified as either an ARN or the ID portion of the ARN.`,
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
        EventDataStore: {
          name: "Event Data Store",
          description:
            "The ARN (or ID suffix of the ARN) of the event data store about which you want information.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetEventDataStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Event Data Store Result",
      description: "Result from GetEventDataStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventDataStoreArn: {
            type: "string",
            description: "The event data store Amazon Resource Number (ARN).",
          },
          Name: {
            type: "string",
            description: "The name of the event data store.",
          },
          Status: {
            type: "string",
            description: "The status of an event data store.",
          },
          AdvancedEventSelectors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                FieldSelectors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Field: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Equals: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StartsWith: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EndsWith: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NotEquals: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NotStartsWith: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NotEndsWith: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Field"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["FieldSelectors"],
              additionalProperties: false,
            },
            description:
              "The advanced event selectors used to select events for the data store.",
          },
          MultiRegionEnabled: {
            type: "boolean",
            description:
              "Indicates whether the event data store includes events from all Regions, or only from the Region in which it was created.",
          },
          OrganizationEnabled: {
            type: "boolean",
            description:
              "Indicates whether an event data store is collecting logged events for an organization in Organizations.",
          },
          RetentionPeriod: {
            type: "number",
            description:
              "The retention period of the event data store, in days.",
          },
          TerminationProtectionEnabled: {
            type: "boolean",
            description: "Indicates that termination protection is enabled.",
          },
          CreatedTimestamp: {
            type: "string",
            description: "The timestamp of the event data store's creation.",
          },
          UpdatedTimestamp: {
            type: "string",
            description:
              "Shows the time that an event data store was updated, if applicable.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "Specifies the KMS key ID that encrypts the events delivered by CloudTrail.",
          },
          BillingMode: {
            type: "string",
            description: "The billing mode for the event data store.",
          },
          FederationStatus: {
            type: "string",
            description: "Indicates the Lake query federation status.",
          },
          FederationRoleArn: {
            type: "string",
            description:
              "If Lake query federation is enabled, provides the ARN of the federation role used to access the resources for the federated event data store.",
          },
          PartitionKeys: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
              },
              required: ["Name", "Type"],
              additionalProperties: false,
            },
            description: "The partition keys for the event data store.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getEventDataStore;
