import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  DescribeReportPlanCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeReportPlan: AppBlock = {
  name: "Describe Report Plan",
  description: `Returns a list of all report plans for an Amazon Web Services account and Amazon Web Services Region.`,
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
        ReportPlanName: {
          name: "Report Plan Name",
          description: "The unique name of a report plan.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeReportPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Report Plan Result",
      description: "Result from DescribeReportPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportPlan: {
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
                      type: "string",
                    },
                  },
                  NumberOfFrameworks: {
                    type: "number",
                  },
                  Accounts: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  OrganizationUnits: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  Regions: {
                    type: "array",
                    items: {
                      type: "string",
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
                      type: "string",
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
            description:
              "Returns details about the report plan that is specified by its name.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeReportPlan;
