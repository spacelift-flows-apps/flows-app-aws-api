import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  DescribeAddonConfigurationCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeAddonConfiguration: AppBlock = {
  name: "Describe Addon Configuration",
  description: `Returns configuration options.`,
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
        addonName: {
          name: "addon Name",
          description: "The name of the add-on.",
          type: "string",
          required: true,
        },
        addonVersion: {
          name: "addon Version",
          description: "The version of the add-on.",
          type: "string",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeAddonConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Addon Configuration Result",
      description: "Result from DescribeAddonConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          addonName: {
            type: "string",
            description: "The name of the add-on.",
          },
          addonVersion: {
            type: "string",
            description: "The version of the add-on.",
          },
          configurationSchema: {
            type: "string",
            description:
              "A JSON schema that's used to validate the configuration values you provide when an add-on is created or updated.",
          },
          podIdentityConfiguration: {
            type: "array",
            items: {
              type: "object",
              properties: {
                serviceAccount: {
                  type: "string",
                },
                recommendedManagedPolicies: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description:
              "The Kubernetes service account name used by the add-on, and any suggested IAM policies.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeAddonConfiguration;
