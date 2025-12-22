import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, ListAssociationVersionsCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAssociationVersions: AppBlock = {
  name: "List Association Versions",
  description: `Retrieves all versions of an association for a specific association ID.`,
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
        AssociationId: {
          name: "Association Id",
          description:
            "The association ID for which you want to view all versions.",
          type: "string",
          required: true,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListAssociationVersionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Association Versions Result",
      description: "Result from ListAssociationVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssociationVersions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AssociationId: {
                  type: "string",
                },
                AssociationVersion: {
                  type: "string",
                },
                CreatedDate: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                DocumentVersion: {
                  type: "string",
                },
                Parameters: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                  },
                },
                Targets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Values: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ScheduleExpression: {
                  type: "string",
                },
                OutputLocation: {
                  type: "object",
                  properties: {
                    S3Location: {
                      type: "object",
                      properties: {
                        OutputS3Region: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3BucketName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OutputS3KeyPrefix: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                AssociationName: {
                  type: "string",
                },
                MaxErrors: {
                  type: "string",
                },
                MaxConcurrency: {
                  type: "string",
                },
                ComplianceSeverity: {
                  type: "string",
                },
                SyncCompliance: {
                  type: "string",
                },
                ApplyOnlyAtCronInterval: {
                  type: "boolean",
                },
                CalendarNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                TargetLocations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Accounts: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Regions: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetLocationMaxConcurrency: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetLocationMaxErrors: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ExecutionRoleName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetLocationAlarmConfiguration: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IncludeChildOrganizationUnits: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ExcludeAccounts: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Targets: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetsMaxConcurrency: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetsMaxErrors: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ScheduleOffset: {
                  type: "number",
                },
                Duration: {
                  type: "number",
                },
                TargetMaps: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                    },
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about all versions of the association for the specified association ID.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listAssociationVersions;
