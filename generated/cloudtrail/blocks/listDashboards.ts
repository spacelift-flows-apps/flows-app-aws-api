import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListDashboardsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDashboards: AppBlock = {
  name: "List Dashboards",
  description: `Returns information about all dashboards in the account, in the current Region.`,
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
        NamePrefix: {
          name: "Name Prefix",
          description: "Specify a name prefix to filter on.",
          type: "string",
          required: false,
        },
        Type: {
          name: "Type",
          description:
            "Specify a dashboard type to filter on: CUSTOM or MANAGED.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A token you can use to get the next page of dashboard results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of dashboards to display on a single page.",
          type: "number",
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

        const command = new ListDashboardsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Dashboards Result",
      description: "Result from ListDashboards operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Dashboards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DashboardArn: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Contains information about dashboards in the account, in the current Region that match the applied filters.",
          },
          NextToken: {
            type: "string",
            description:
              "A token you can use to get the next page of dashboard results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDashboards;
