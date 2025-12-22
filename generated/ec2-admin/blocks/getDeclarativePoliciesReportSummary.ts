import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetDeclarativePoliciesReportSummaryCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDeclarativePoliciesReportSummary: AppBlock = {
  name: "Get Declarative Policies Report Summary",
  description: `Retrieves a summary of the account status report.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ReportId: {
          name: "Report Id",
          description: "The ID of the report.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDeclarativePoliciesReportSummaryCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Declarative Policies Report Summary Result",
      description: "Result from GetDeclarativePoliciesReportSummary operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportId: {
            type: "string",
            description: "The ID of the report.",
          },
          S3Bucket: {
            type: "string",
            description:
              "The name of the Amazon S3 bucket where the report is located.",
          },
          S3Prefix: {
            type: "string",
            description: "The prefix for your S3 object.",
          },
          TargetId: {
            type: "string",
            description: "The root ID, organizational unit ID, or account ID.",
          },
          StartTime: {
            type: "string",
            description: "The time when the report generation started.",
          },
          EndTime: {
            type: "string",
            description: "The time when the report generation ended.",
          },
          NumberOfAccounts: {
            type: "number",
            description:
              "The total number of accounts associated with the specified targetId.",
          },
          NumberOfFailedAccounts: {
            type: "number",
            description:
              "The number of accounts where attributes could not be retrieved in any Region.",
          },
          AttributeSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AttributeName: {
                  type: "string",
                },
                MostFrequentValue: {
                  type: "string",
                },
                NumberOfMatchedAccounts: {
                  type: "number",
                },
                NumberOfUnmatchedAccounts: {
                  type: "number",
                },
                RegionalSummaries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      RegionName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NumberOfMatchedAccounts: {
                        type: "object",
                        additionalProperties: true,
                      },
                      NumberOfUnmatchedAccounts: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The attributes described in the report.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDeclarativePoliciesReportSummary;
