import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListReportJobsCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { convertTimestamps } from "../utils/convertTimestamps";

const listReportJobs: AppBlock = {
  name: "List Report Jobs",
  description: `Returns details about your report jobs.`,
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
        ByReportPlanName: {
          name: "By Report Plan Name",
          description:
            "Returns only report jobs with the specified report plan name.",
          type: "string",
          required: false,
        },
        ByCreationBefore: {
          name: "By Creation Before",
          description:
            "Returns only report jobs that were created before the date and time specified in Unix format and Coordinated Universal Time (UTC).",
          type: "string",
          required: false,
        },
        ByCreationAfter: {
          name: "By Creation After",
          description:
            "Returns only report jobs that were created after the date and time specified in Unix format and Coordinated Universal Time (UTC).",
          type: "string",
          required: false,
        },
        ByStatus: {
          name: "By Status",
          description:
            "Returns only report jobs that are in the specified status.",
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

        const command = new ListReportJobsCommand(
          convertTimestamps(
            commandInput,
            new Set(["ByCreationBefore", "ByCreationAfter"]),
          ) as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Report Jobs Result",
      description: "Result from ListReportJobs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportJobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ReportJobId: {
                  type: "string",
                },
                ReportPlanArn: {
                  type: "string",
                },
                ReportTemplate: {
                  type: "string",
                },
                CreationTime: {
                  type: "string",
                },
                CompletionTime: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                ReportDestination: {
                  type: "object",
                  properties: {
                    S3BucketName: {
                      type: "string",
                    },
                    S3Keys: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Details about your report jobs in JSON format.",
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

export default listReportJobs;
