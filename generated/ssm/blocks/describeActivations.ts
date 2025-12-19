import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, DescribeActivationsCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeActivations: AppBlock = {
  name: "Describe Activations",
  description: `Describes details about the activation, such as the date and time the activation was created, its expiration date, the Identity and Access Management (IAM) role assigned to the managed nodes in the activation, and the number of nodes registered by using this activation.`,
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
        Filters: {
          name: "Filters",
          description: "A filter to view information about your activations.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                FilterKey: {
                  type: "string",
                },
                FilterValues: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of items to return for this call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "A token to start the list.",
          type: "string",
          required: false,
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeActivationsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Activations Result",
      description: "Result from DescribeActivations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ActivationList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ActivationId: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                DefaultInstanceName: {
                  type: "string",
                },
                IamRole: {
                  type: "string",
                },
                RegistrationLimit: {
                  type: "number",
                },
                RegistrationsCount: {
                  type: "number",
                },
                ExpirationDate: {
                  type: "string",
                },
                Expired: {
                  type: "boolean",
                },
                CreatedDate: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Key", "Value"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of activations for your Amazon Web Services account.",
          },
          NextToken: {
            type: "string",
            description: "The token for the next set of items to return.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeActivations;
