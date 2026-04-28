import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, CreateReportPlanCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createReportPlan: AppBlock = {
  name: "Create Report Plan",
  description: `Creates a report plan.`,
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
          description: "The unique name of the report plan.",
          type: "string",
          required: true,
        },
        ReportPlanDescription: {
          name: "Report Plan Description",
          description:
            "An optional description of the report plan with a maximum of 1,024 characters.",
          type: "string",
          required: false,
        },
        ReportDeliveryChannel: {
          name: "Report Delivery Channel",
          description:
            "A structure that contains information about where and how to deliver your reports, specifically your Amazon S3 bucket name, S3 key prefix, and the formats of your reports.",
          type: {
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
          required: true,
        },
        ReportSetting: {
          name: "Report Setting",
          description: "Identifies the report template for the report.",
          type: {
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
          required: true,
        },
        ReportPlanTags: {
          name: "Report Plan Tags",
          description: "The tags to assign to the report plan.",
          type: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          required: false,
        },
        IdempotencyToken: {
          name: "Idempotency Token",
          description:
            "A customer-chosen string that you can use to distinguish between otherwise identical calls to CreateReportPlanInput.",
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

        const command = new CreateReportPlanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Report Plan Result",
      description: "Result from CreateReportPlan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportPlanName: {
            type: "string",
            description: "The unique name of the report plan.",
          },
          ReportPlanArn: {
            type: "string",
            description:
              "An Amazon Resource Name (ARN) that uniquely identifies a resource.",
          },
          CreationTime: {
            type: "string",
            description:
              "The date and time a backup vault is created, in Unix format and Coordinated Universal Time (UTC).",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createReportPlan;
