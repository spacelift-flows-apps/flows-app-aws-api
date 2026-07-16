import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  ListCreateAccountStatusCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCreateAccountStatus: AppBlock = {
  name: "List Create Account Status",
  description: `Lists the account creation requests that match the specified status that is currently being tracked for the organization.`,
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
        States: {
          name: "States",
          description:
            "A list of one or more states that you want included in the response.",
          type: {
            type: "array",
            items: {
              type: "string",
              enum: ["IN_PROGRESS", "SUCCEEDED", "FAILED"],
            },
          },
          required: false,
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
          description: "The maximum number of items to return in the response.",
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

        const command = new ListCreateAccountStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Create Account Status Result",
      description: "Result from ListCreateAccountStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreateAccountStatuses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                AccountName: {
                  type: "string",
                },
                State: {
                  type: "string",
                  enum: ["IN_PROGRESS", "SUCCEEDED", "FAILED"],
                },
                RequestedTimestamp: {
                  type: "string",
                },
                CompletedTimestamp: {
                  type: "string",
                },
                AccountId: {
                  type: "string",
                },
                GovCloudAccountId: {
                  type: "string",
                },
                FailureReason: {
                  type: "string",
                  enum: [
                    "ACCOUNT_LIMIT_EXCEEDED",
                    "EMAIL_ALREADY_EXISTS",
                    "INVALID_ADDRESS",
                    "INVALID_EMAIL",
                    "CONCURRENT_ACCOUNT_MODIFICATION",
                    "INTERNAL_FAILURE",
                    "GOVCLOUD_ACCOUNT_ALREADY_EXISTS",
                    "MISSING_BUSINESS_VALIDATION",
                    "FAILED_BUSINESS_VALIDATION",
                    "PENDING_BUSINESS_VALIDATION",
                    "INVALID_IDENTITY_FOR_BUSINESS_VALIDATION",
                    "UNKNOWN_BUSINESS_VALIDATION",
                    "MISSING_PAYMENT_INSTRUMENT",
                    "INVALID_PAYMENT_INSTRUMENT",
                    "UPDATE_EXISTING_RESOURCE_POLICY_WITH_TAGS_NOT_SUPPORTED",
                  ],
                },
              },
              additionalProperties: false,
            },
            description: "A list of objects with details about the requests.",
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

export default listCreateAccountStatus;
