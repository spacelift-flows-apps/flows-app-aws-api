import { AppBlock, events } from "@slflows/sdk/v1";
import {
  HealthClient,
  DescribeAffectedAccountsForOrganizationCommand,
} from "@aws-sdk/client-health";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAffectedAccountsForOrganization: AppBlock = {
  name: "Describe Affected Accounts For Organization",
  description: `Returns a list of accounts in the organization from Organizations that are affected by the provided event.`,
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
        eventArn: {
          name: "event Arn",
          description: "The unique identifier for the event.",
          type: "string",
          required: true,
        },
        nextToken: {
          name: "next Token",
          description:
            "If the results of a search are large, only a portion of the results are returned, and a nextToken pagination token is returned in the response.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of items to return in one batch, between 10 and 100, inclusive.",
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

        const client = new HealthClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAffectedAccountsForOrganizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Affected Accounts For Organization Result",
      description:
        "Result from DescribeAffectedAccountsForOrganization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          affectedAccounts: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A JSON set of elements of the affected accounts.",
          },
          eventScopeCode: {
            type: "string",
            description:
              "This parameter specifies if the Health event is a public Amazon Web Services service event or an account-specific event.",
          },
          nextToken: {
            type: "string",
            description:
              "If the results of a search are large, only a portion of the results are returned, and a nextToken pagination token is returned in the response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAffectedAccountsForOrganization;
