import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  ListEffectivePolicyValidationErrorsCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listEffectivePolicyValidationErrors: AppBlock = {
  name: "List Effective Policy Validation Errors",
  description: `Lists all the validation errors on an effective policy for a specified account and policy type.`,
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
          description: "The ID of the account that you want details about.",
          type: "string",
          required: true,
        },
        PolicyType: {
          name: "Policy Type",
          description: "The type of policy that you want information about.",
          type: {
            type: "string",
            enum: [
              "TAG_POLICY",
              "BACKUP_POLICY",
              "AISERVICES_OPT_OUT_POLICY",
              "CHATBOT_POLICY",
              "DECLARATIVE_POLICY_EC2",
              "SECURITYHUB_POLICY",
              "INSPECTOR_POLICY",
              "UPGRADE_ROLLOUT_POLICY",
              "BEDROCK_POLICY",
              "S3_POLICY",
              "NETWORK_SECURITY_DIRECTOR_POLICY",
            ],
          },
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

        const command = new ListEffectivePolicyValidationErrorsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Effective Policy Validation Errors Result",
      description: "Result from ListEffectivePolicyValidationErrors operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AccountId: {
            type: "string",
            description: "The ID of the specified account.",
          },
          PolicyType: {
            type: "string",
            enum: [
              "TAG_POLICY",
              "BACKUP_POLICY",
              "AISERVICES_OPT_OUT_POLICY",
              "CHATBOT_POLICY",
              "DECLARATIVE_POLICY_EC2",
              "SECURITYHUB_POLICY",
              "INSPECTOR_POLICY",
              "UPGRADE_ROLLOUT_POLICY",
              "BEDROCK_POLICY",
              "S3_POLICY",
              "NETWORK_SECURITY_DIRECTOR_POLICY",
            ],
            description: "The specified policy type.",
          },
          Path: {
            type: "string",
            description:
              "The path in the organization where the specified account exists.",
          },
          EvaluationTimestamp: {
            type: "string",
            description:
              "The time when the latest effective policy was generated for the specified account.",
          },
          NextToken: {
            type: "string",
            description:
              "If present, indicates that more output is available than is included in the current response.",
          },
          EffectivePolicyValidationErrors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ErrorCode: {
                  type: "string",
                },
                ErrorMessage: {
                  type: "string",
                },
                PathToError: {
                  type: "string",
                },
                ContributingPolicies: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The EffectivePolicyValidationError object contains details about the validation errors that occurred when generating or enforcing an effective policy, such as which policies contributed to the error and location of the error.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listEffectivePolicyValidationErrors;
