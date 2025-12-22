import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  CreateEventDataStoreCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createEventDataStore: AppBlock = {
  name: "Create Event Data Store",
  description: `Creates a new event data store.`,
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
        Name: {
          name: "Name",
          description: "The name of the event data store.",
          type: "string",
          required: true,
        },
        AdvancedEventSelectors: {
          name: "Advanced Event Selectors",
          description:
            "The advanced event selectors to use to select the events for the data store.",
          type: {
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
          },
          required: false,
        },
        MultiRegionEnabled: {
          name: "Multi Region Enabled",
          description:
            "Specifies whether the event data store includes events from all Regions, or only from the Region in which the event data store is created.",
          type: "boolean",
          required: false,
        },
        OrganizationEnabled: {
          name: "Organization Enabled",
          description:
            "Specifies whether an event data store collects events logged for an organization in Organizations.",
          type: "boolean",
          required: false,
        },
        RetentionPeriod: {
          name: "Retention Period",
          description: "The retention period of the event data store, in days.",
          type: "number",
          required: false,
        },
        TerminationProtectionEnabled: {
          name: "Termination Protection Enabled",
          description:
            "Specifies whether termination protection is enabled for the event data store.",
          type: "boolean",
          required: false,
        },
        TagsList: {
          name: "Tags List",
          description: "A list of tags.",
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
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "Specifies the KMS key ID to use to encrypt the events delivered by CloudTrail.",
          type: "string",
          required: false,
        },
        StartIngestion: {
          name: "Start Ingestion",
          description:
            "Specifies whether the event data store should start ingesting live events.",
          type: "boolean",
          required: false,
        },
        BillingMode: {
          name: "Billing Mode",
          description:
            "The billing mode for the event data store determines the cost for ingesting events and the default and maximum retention period for the event data store.",
          type: "string",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateEventDataStoreCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Event Data Store Result",
      description: "Result from CreateEventDataStore operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          EventDataStoreArn: {
            type: "string",
            description: "The ARN of the event data store.",
          },
          Name: {
            type: "string",
            description: "The name of the event data store.",
          },
          Status: {
            type: "string",
            description: "The status of event data store creation.",
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
              "The advanced event selectors that were used to select the events for the data store.",
          },
          MultiRegionEnabled: {
            type: "boolean",
            description:
              "Indicates whether the event data store collects events from all Regions, or only from the Region in which it was created.",
          },
          OrganizationEnabled: {
            type: "boolean",
            description:
              "Indicates whether an event data store is collecting logged events for an organization in Organizations.",
          },
          RetentionPeriod: {
            type: "number",
            description:
              "The retention period of an event data store, in days.",
          },
          TerminationProtectionEnabled: {
            type: "boolean",
            description:
              "Indicates whether termination protection is enabled for the event data store.",
          },
          TagsList: {
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
              required: ["Key"],
              additionalProperties: false,
            },
            description: "A list of tags.",
          },
          CreatedTimestamp: {
            type: "string",
            description:
              "The timestamp that shows when the event data store was created.",
          },
          UpdatedTimestamp: {
            type: "string",
            description:
              "The timestamp that shows when an event data store was updated, if applicable.",
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
        },
        additionalProperties: true,
      },
    },
  },
};

export default createEventDataStore;
