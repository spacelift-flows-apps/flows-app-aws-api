import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListReportPlansCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listReportPlans: AppBlock = {
  name: "List Report Plans",
  description: `Returns a list of your report plans.`,
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
        MaxResults: {
          name: "Max Results",
          description: "The number of desired results from 1 to 1000.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "An identifier that was returned from the previous call to this operation, which can be used to return the next set of items in the list.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListReportPlansCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Report Plans Result",
      description: "Result from ListReportPlans operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportPlans: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ReportPlanArn: {
                  type: "string",
                },
                ReportPlanName: {
                  type: "string",
                },
                ReportPlanDescription: {
                  type: "string",
                },
                ReportSetting: {
                  type: "object",
                  properties: {
                    ReportTemplate: {
                      type: "string",
                    },
                    FrameworkArns: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    NumberOfFrameworks: {
                      type: "number",
                    },
                    Accounts: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    OrganizationUnits: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    Regions: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["ReportTemplate"],
                  additionalProperties: false,
                },
                ReportDeliveryChannel: {
                  type: "object",
                  properties: {
                    S3BucketName: {
                      type: "string",
                    },
                    S3KeyPrefix: {
                      type: "string",
                    },
                    Formats: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["S3BucketName"],
                  additionalProperties: false,
                },
                DeploymentStatus: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                LastAttemptedExecutionTime: {
                  type: "string",
                },
                LastSuccessfulExecutionTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The report plans with detailed information for each plan.",
          },
          NextToken: {
            type: "string",
            description:
              "An identifier that was returned from the previous call to this operation, which can be used to return the next set of items in the list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listReportPlans;
