import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListQueryLoggingConfigsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listQueryLoggingConfigs: AppBlock = {
  name: "List Query Logging Configs",
  description: `Lists the configurations for DNS query logging that are associated with the current Amazon Web Services account or the configuration that is associated with a specified hosted zone.`,
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
        HostedZoneId: {
          name: "Hosted Zone Id",
          description:
            "(Optional) If you want to list the query logging configuration that is associated with a hosted zone, specify the ID in HostedZoneId.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "(Optional) If the current Amazon Web Services account has more than MaxResults query logging configurations, use NextToken to get the second and subsequent pages of results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "(Optional) The maximum number of query logging configurations that you want Amazon Route 53 to return in response to the current request.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListQueryLoggingConfigsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Query Logging Configs Result",
      description: "Result from ListQueryLoggingConfigs operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryLoggingConfigs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                HostedZoneId: {
                  type: "string",
                },
                CloudWatchLogsLogGroupArn: {
                  type: "string",
                },
              },
              required: ["Id", "HostedZoneId", "CloudWatchLogsLogGroupArn"],
              additionalProperties: false,
            },
            description:
              "An array that contains one QueryLoggingConfig element for each configuration for DNS query logging that is associated with the current Amazon Web Services account.",
          },
          NextToken: {
            type: "string",
            description:
              "If a response includes the last of the query logging configurations that are associated with the current Amazon Web Services account, NextToken doesn't appear in the response.",
          },
        },
        required: ["QueryLoggingConfigs"],
      },
    },
  },
};

export default listQueryLoggingConfigs;
