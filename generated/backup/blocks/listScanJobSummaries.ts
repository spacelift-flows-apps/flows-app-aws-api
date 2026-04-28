import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BackupClient,
  ListScanJobSummariesCommand,
} from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listScanJobSummaries: AppBlock = {
  name: "List Scan Job Summaries",
  description: `This is a request for a summary of scan jobs created or running within the most recent 30 days.`,
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
        AccountId: {
          name: "Account Id",
          description: "Returns the job count for the specified account.",
          type: "string",
          required: false,
        },
        ResourceType: {
          name: "Resource Type",
          description: "Returns the job count for the specified resource type.",
          type: "string",
          required: false,
        },
        MalwareScanner: {
          name: "Malware Scanner",
          description:
            "Returns only the scan jobs for the specified malware scanner.",
          type: "string",
          required: false,
        },
        ScanResultStatus: {
          name: "Scan Result Status",
          description:
            "Returns only the scan jobs for the specified scan results.",
          type: "string",
          required: false,
        },
        State: {
          name: "State",
          description:
            "Returns only the scan jobs for the specified scanning job state.",
          type: "string",
          required: false,
        },
        AggregationPeriod: {
          name: "Aggregation Period",
          description: "The period for the returned results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to be returned.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The next item following a partial list of returned items.",
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

        const command = new ListScanJobSummariesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Scan Job Summaries Result",
      description: "Result from ListScanJobSummaries operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ScanJobSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Region: {
                  type: "string",
                },
                AccountId: {
                  type: "string",
                },
                State: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                Count: {
                  type: "number",
                },
                StartTime: {
                  type: "string",
                },
                EndTime: {
                  type: "string",
                },
                MalwareScanner: {
                  type: "string",
                },
                ScanResultStatus: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The summary information.",
          },
          AggregationPeriod: {
            type: "string",
            description: "The period for the returned results.",
          },
          NextToken: {
            type: "string",
            description:
              "The next item following a partial list of returned items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listScanJobSummaries;
