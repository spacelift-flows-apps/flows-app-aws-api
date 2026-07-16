import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  DescribeCreateAccountStatusCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCreateAccountStatus: AppBlock = {
  name: "Describe Create Account Status",
  description: `Retrieves the current status of an asynchronous request to create an account.`,
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
        CreateAccountRequestId: {
          name: "Create Account Request Id",
          description:
            "Specifies the Id value that uniquely identifies the CreateAccount request.",
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

        const client = new OrganizationsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeCreateAccountStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Create Account Status Result",
      description: "Result from DescribeCreateAccountStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CreateAccountStatus: {
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
            description:
              "A structure that contains the current status of an account creation request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCreateAccountStatus;
