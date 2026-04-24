import { AppBlock, events } from "@slflows/sdk/v1";
import {
  OrganizationsClient,
  CreatePolicyCommand,
} from "@aws-sdk/client-organizations";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPolicy: AppBlock = {
  name: "Create Policy",
  description: `Creates a policy of a specified type that you can attach to a root, an organizational unit (OU), or an individual Amazon Web Services account.`,
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
        Content: {
          name: "Content",
          description: "The policy text content to add to the new policy.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description: "An optional description to assign to the policy.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The friendly name to assign to the policy.",
          type: "string",
          required: true,
        },
        Type: {
          name: "Type",
          description: "The type of policy to create.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description:
            "A list of tags that you want to attach to the newly created policy.",
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
              PolicySummary: {
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
                  Description: {
                    type: "string",
                  },
                  Type: {
                    type: "string",
                  },
                  AwsManaged: {
                    type: "boolean",
                  },
                },
                additionalProperties: false,
              },
              Content: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "A structure that contains details about the newly created policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPolicy;
