import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeCustomDomainAssociationsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeCustomDomainAssociations: AppBlock = {
  name: "Describe Custom Domain Associations",
  description: `Contains information about custom domain associations for a cluster.`,
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
        CustomDomainName: {
          name: "Custom Domain Name",
          description:
            "The custom domain name for the custom domain association.",
          type: "string",
          required: false,
        },
        CustomDomainCertificateArn: {
          name: "Custom Domain Certificate Arn",
          description:
            "The certificate Amazon Resource Name (ARN) for the custom domain association.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum records setting for the associated custom domain.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the custom domain association.",
          type: "string",
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

        const command = new DescribeCustomDomainAssociationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Custom Domain Associations Result",
      description: "Result from DescribeCustomDomainAssociations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Marker: {
            type: "string",
            description: "The marker for the custom domain association.",
          },
          Associations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CustomDomainCertificateArn: {
                  type: "string",
                },
                CustomDomainCertificateExpiryDate: {
                  type: "string",
                },
                CertificateAssociations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CustomDomainName: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ClusterIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The associations for the custom domain.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeCustomDomainAssociations;
