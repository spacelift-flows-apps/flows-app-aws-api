import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreateActivationCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createActivation: AppBlock = {
  name: "Create Activation",
  description: `Generates an activation code and activation ID you can use to register your on-premises servers, edge devices, or virtual machine (VM) with Amazon Web Services Systems Manager.`,
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
        Description: {
          name: "Description",
          description:
            "A user-defined description of the resource that you want to register with Systems Manager.",
          type: "string",
          required: false,
        },
        DefaultInstanceName: {
          name: "Default Instance Name",
          description:
            "The name of the registered, managed node as it will appear in the Amazon Web Services Systems Manager console or when you use the Amazon Web Services command line tools to list Systems Manager resources.",
          type: "string",
          required: false,
        },
        IamRole: {
          name: "Iam Role",
          description:
            "The name of the Identity and Access Management (IAM) role that you want to assign to the managed node.",
          type: "string",
          required: true,
        },
        RegistrationLimit: {
          name: "Registration Limit",
          description:
            "Specify the maximum number of managed nodes you want to register.",
          type: "number",
          required: false,
        },
        ExpirationDate: {
          name: "Expiration Date",
          description:
            'The date by which this activation request should expire, in timestamp format, such as "2024-07-07T00:00:00".',
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Optional metadata that you assign to a resource.",
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
        RegistrationMetadata: {
          name: "Registration Metadata",
          description: "Reserved for internal use.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateActivationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Activation Result",
      description: "Result from CreateActivation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ActivationId: {
            type: "string",
            description:
              "The ID number generated by the system when it processed the activation.",
          },
          ActivationCode: {
            type: "string",
            description:
              "The code the system generates when it processes the activation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createActivation;
