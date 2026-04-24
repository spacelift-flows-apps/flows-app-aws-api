import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  ListAccountsForParentCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAccountsForParent: AppBlock = {
  name: "List Accounts For Parent",
  description: `Lists the accounts in an organization that are contained by the specified target root or organizational unit (OU).`,
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
        ParentId: {
          name: "Parent Id",
          description:
            "The unique identifier (ID) for the parent root or organization unit (OU) whose accounts you want to list.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The parameter for receiving additional results if you receive a NextToken response in a previous request.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The total number of results that you want included on each page of the response.",
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListAccountsForParentCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Accounts For Parent Result",
      description: "Result from ListAccountsForParent operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Accounts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Arn: {
                  type: "string",
                },
                Email: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                JoinedMethod: {
                  type: "string",
                },
                JoinedTimestamp: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of the accounts in the specified root or OU.",
          },
          NextToken: {
            type: "string",
            description:
              "If present, indicates that more output is available than is included in the current response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listAccountsForParent;
