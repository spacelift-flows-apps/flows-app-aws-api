import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  ListPoliciesGrantingServiceAccessCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listPoliciesGrantingServiceAccess: AppBlock = {
  name: "List Policies Granting Service Access",
  description: `Retrieves a list of policies that the IAM identity (user, group, or role) can use to access each specified service.`,
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
        Marker: {
          name: "Marker",
          description:
            "Use this parameter only when paginating results and only after you receive a response indicating that the results are truncated.",
          type: "string",
          required: false,
        },
        Arn: {
          name: "Arn",
          description:
            "The ARN of the IAM identity (user, group, or role) whose policies you want to list.",
          type: "string",
          required: true,
        },
        ServiceNamespaces: {
          name: "Service Namespaces",
          description:
            "The service namespace for the Amazon Web Services services whose policies you want to list.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
      },
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } =
          input.event.inputConfig;

        // Determine credentials to use
        let credentials;
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
        } else {
          // Use app-level credentials
          credentials = {
            accessKeyId: input.app.config.accessKeyId,
            secretAccessKey: input.app.config.secretAccessKey,
            sessionToken: input.app.config.sessionToken,
          };
        }

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListPoliciesGrantingServiceAccessCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Policies Granting Service Access Result",
      description: "Result from ListPoliciesGrantingServiceAccess operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PoliciesGrantingServiceAccess: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ServiceNamespace: {
                  type: "string",
                },
                Policies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      PolicyName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      PolicyArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EntityType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      EntityName: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["PolicyName", "PolicyType"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A ListPoliciesGrantingServiceAccess object that contains details about the permissions policies attached to the specified identity (user, group, or role).",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more items to return.",
          },
          Marker: {
            type: "string",
            description:
              "When IsTruncated is true, this element is present and contains the value to use for the Marker parameter in a subsequent pagination request.",
          },
        },
        required: ["PoliciesGrantingServiceAccess"],
      },
    },
  },
};

export default listPoliciesGrantingServiceAccess;
