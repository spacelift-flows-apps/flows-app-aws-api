import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  CreateRedshiftIdcApplicationCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createRedshiftIdcApplication: AppBlock = {
  name: "Create Redshift Idc Application",
  description: `Creates an Amazon Redshift application for use with IAM Identity Center.`,
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
        IdcInstanceArn: {
          name: "Idc Instance Arn",
          description:
            "The Amazon resource name (ARN) of the IAM Identity Center instance where Amazon Redshift creates a new managed application.",
          type: "string",
          required: true,
        },
        RedshiftIdcApplicationName: {
          name: "Redshift Idc Application Name",
          description:
            "The name of the Redshift application in IAM Identity Center.",
          type: "string",
          required: true,
        },
        IdentityNamespace: {
          name: "Identity Namespace",
          description:
            "The namespace for the Amazon Redshift IAM Identity Center application instance.",
          type: "string",
          required: false,
        },
        IdcDisplayName: {
          name: "Idc Display Name",
          description:
            "The display name for the Amazon Redshift IAM Identity Center application instance.",
          type: "string",
          required: true,
        },
        IamRoleArn: {
          name: "Iam Role Arn",
          description:
            "The IAM role ARN for the Amazon Redshift IAM Identity Center application instance.",
          type: "string",
          required: true,
        },
        AuthorizedTokenIssuerList: {
          name: "Authorized Token Issuer List",
          description:
            "The token issuer list for the Amazon Redshift IAM Identity Center application instance.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TrustedTokenIssuerArn: {
                  type: "string",
                },
                AuthorizedAudiencesList: {
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
        ServiceIntegrations: {
          name: "Service Integrations",
          description:
            "A collection of service integrations for the Redshift IAM Identity Center application.",
          type: {
            type: "array",
            items: {
              type: "string",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateRedshiftIdcApplicationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Redshift Idc Application Result",
      description: "Result from CreateRedshiftIdcApplication operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RedshiftIdcApplication: {
            type: "object",
            properties: {
              IdcInstanceArn: {
                type: "string",
              },
              RedshiftIdcApplicationName: {
                type: "string",
              },
              RedshiftIdcApplicationArn: {
                type: "string",
              },
              IdentityNamespace: {
                type: "string",
              },
              IdcDisplayName: {
                type: "string",
              },
              IamRoleArn: {
                type: "string",
              },
              IdcManagedApplicationArn: {
                type: "string",
              },
              IdcOnboardStatus: {
                type: "string",
              },
              AuthorizedTokenIssuerList: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    TrustedTokenIssuerArn: {
                      type: "string",
                    },
                    AuthorizedAudiencesList: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
              ServiceIntegrations: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description:
              "Contains properties for the Redshift IDC application.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createRedshiftIdcApplication;
