import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  ListRootsCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listRoots: AppBlock = {
  name: "List Roots",
  description: `Lists the roots that are defined in the current organization.`,
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

        const command = new ListRootsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Roots Result",
      description: "Result from ListRoots operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Roots: {
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
                Name: {
                  type: "string",
                },
                PolicyTypes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Type: {
                        type: "string",
                        enum: [
                          "SERVICE_CONTROL_POLICY",
                          "RESOURCE_CONTROL_POLICY",
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
                      Status: {
                        type: "string",
                        enum: ["ENABLED", "PENDING_ENABLE", "PENDING_DISABLE"],
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "A list of roots that are defined in an organization.",
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

export default listRoots;
