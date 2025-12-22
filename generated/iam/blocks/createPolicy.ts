import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, CreatePolicyCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPolicy: AppBlock = {
  name: "Create Policy",
  description: `Creates a new managed policy for your Amazon Web Services account.`,
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
        PolicyName: {
          name: "Policy Name",
          description: "The friendly name of the policy.",
          type: "string",
          required: true,
        },
        Path: {
          name: "Path",
          description: "The path for the policy.",
          type: "string",
          required: false,
        },
        PolicyDocument: {
          name: "Policy Document",
          description:
            "The JSON policy document that you want to use as the content for the new policy.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "A friendly description of the policy.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the new IAM customer managed policy.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreatePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Policy Result",
      description: "Result from CreatePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Policy: {
            type: "object",
            properties: {
              PolicyName: {
                type: "string",
              },
              PolicyId: {
                type: "string",
              },
              Arn: {
                type: "string",
              },
              Path: {
                type: "string",
              },
              DefaultVersionId: {
                type: "string",
              },
              AttachmentCount: {
                type: "number",
              },
              PermissionsBoundaryUsageCount: {
                type: "number",
              },
              IsAttachable: {
                type: "boolean",
              },
              Description: {
                type: "string",
              },
              CreateDate: {
                type: "string",
              },
              UpdateDate: {
                type: "string",
              },
              Tags: {
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
            },
            additionalProperties: false,
            description: "A structure containing details about the new policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPolicy;
