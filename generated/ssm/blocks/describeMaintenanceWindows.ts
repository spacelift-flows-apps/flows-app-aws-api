import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeMaintenanceWindowsCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeMaintenanceWindows: AppBlock = {
  name: "Describe Maintenance Windows",
  description: `Retrieves the maintenance windows in an Amazon Web Services account.`,
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
        Filters: {
          name: "Filters",
          description:
            "Optional filters used to narrow down the scope of the returned maintenance windows.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeMaintenanceWindowsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Maintenance Windows Result",
      description: "Result from DescribeMaintenanceWindows operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          WindowIdentities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                WindowId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                Enabled: {
                  type: "boolean",
                },
                Duration: {
                  type: "number",
                },
                Cutoff: {
                  type: "number",
                },
                Schedule: {
                  type: "string",
                },
                ScheduleTimezone: {
                  type: "string",
                },
                ScheduleOffset: {
                  type: "number",
                },
                EndDate: {
                  type: "string",
                },
                StartDate: {
                  type: "string",
                },
                NextExecutionTime: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the maintenance windows.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeMaintenanceWindows;
