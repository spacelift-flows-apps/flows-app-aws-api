import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  CreateGovCloudAccountCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createGovCloudAccount: AppBlock = {
  name: "Create Gov Cloud Account",
  description: `This action is available if all of the following are true: You're authorized to create accounts in the Amazon Web Services GovCloud (US) Region.`,
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
        Email: {
          name: "Email",
          description:
            "Specifies the email address of the owner to assign to the new member account in the commercial Region.",
          type: "string",
          required: true,
        },
        AccountName: {
          name: "Account Name",
          description: "The friendly name of the member account.",
          type: "string",
          required: true,
        },
        RoleName: {
          name: "Role Name",
          description:
            "(Optional) The name of an IAM role that Organizations automatically preconfigures in the new member accounts in both the Amazon Web Services GovCloud (US) Region and in the commercial Region.",
          type: "string",
          required: false,
        },
        IamUserAccessToBilling: {
          name: "Iam User Access To Billing",
          description:
            "If set to ALLOW, the new linked account in the commercial Region enables IAM users to access account billing information if they have the required permissions.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the newly created account.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
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

        const command = new CreateGovCloudAccountCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Gov Cloud Account Result",
      description: "Result from CreateGovCloudAccount operation",
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
              },
            },
            additionalProperties: false,
            description:
              "Contains the status about a CreateAccount or CreateGovCloudAccount request to create an Amazon Web Services account or an Amazon Web Services GovCloud (US) account in an organization.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createGovCloudAccount;
