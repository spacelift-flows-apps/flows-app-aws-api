import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateHsmConfigurationCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createHsmConfiguration: AppBlock = {
  name: "Create Hsm Configuration",
  description: `Creates an HSM configuration that contains the information required by an Amazon Redshift cluster to store and use database encryption keys in a Hardware Security Module (HSM).`,
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
        HsmConfigurationIdentifier: {
          name: "Hsm Configuration Identifier",
          description:
            "The identifier to be assigned to the new Amazon Redshift HSM configuration.",
          type: "string",
          required: true,
        },
        Description: {
          name: "Description",
          description:
            "A text description of the HSM configuration to be created.",
          type: "string",
          required: true,
        },
        HsmIpAddress: {
          name: "Hsm Ip Address",
          description:
            "The IP address that the Amazon Redshift cluster must use to access the HSM.",
          type: "string",
          required: true,
        },
        HsmPartitionName: {
          name: "Hsm Partition Name",
          description:
            "The name of the partition in the HSM where the Amazon Redshift clusters will store their database encryption keys.",
          type: "string",
          required: true,
        },
        HsmPartitionPassword: {
          name: "Hsm Partition Password",
          description: "The password required to access the HSM partition.",
          type: "string",
          required: true,
        },
        HsmServerPublicCertificate: {
          name: "Hsm Server Public Certificate",
          description: "The HSMs public certificate file.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "A list of tag instances.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateHsmConfigurationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Hsm Configuration Result",
      description: "Result from CreateHsmConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HsmConfiguration: {
            type: "object",
            properties: {
              HsmConfigurationIdentifier: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              HsmIpAddress: {
                type: "string",
              },
              HsmPartitionName: {
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
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
            description:
              "Returns information about an HSM configuration, which is an object that describes to Amazon Redshift clusters the information they require to connect to an HSM where they can store database encryption keys.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createHsmConfiguration;
