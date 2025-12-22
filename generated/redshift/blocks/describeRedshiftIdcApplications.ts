import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeRedshiftIdcApplicationsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeRedshiftIdcApplications: AppBlock = {
  name: "Describe Redshift Idc Applications",
  description: `Lists the Amazon Redshift IAM Identity Center applications.`,
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
        RedshiftIdcApplicationArn: {
          name: "Redshift Idc Application Arn",
          description:
            "The ARN for the Redshift application that integrates with IAM Identity Center.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of response records to return in each call.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "A value that indicates the starting point for the next set of response records in a subsequent request.",
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

        const command = new DescribeRedshiftIdcApplicationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Redshift Idc Applications Result",
      description: "Result from DescribeRedshiftIdcApplications operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RedshiftIdcApplications: {
            type: "array",
            items: {
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
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthorizedAudiencesList: {
                        type: "object",
                        additionalProperties: true,
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
            },
            description:
              "The list of Amazon Redshift IAM Identity Center applications.",
          },
          Marker: {
            type: "string",
            description:
              "A value that indicates the starting point for the next set of response records in a subsequent request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeRedshiftIdcApplications;
