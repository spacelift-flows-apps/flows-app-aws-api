import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeDataSharesCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDataShares: AppBlock = {
  name: "Describe Data Shares",
  description: `Shows the status of any inbound or outbound datashares available in the specified account.`,
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
        DataShareArn: {
          name: "Data Share Arn",
          description:
            "The Amazon resource name (ARN) of the datashare to describe details of.",
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
            "An optional parameter that specifies the starting point to return a set of response records.",
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

        const command = new DescribeDataSharesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Data Shares Result",
      description: "Result from DescribeDataShares operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DataShares: {
            type: "array",
            items: {
              type: "object",
              properties: {
                DataShareArn: {
                  type: "string",
                },
                ProducerArn: {
                  type: "string",
                },
                AllowPubliclyAccessibleConsumers: {
                  type: "boolean",
                },
                DataShareAssociations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ConsumerIdentifier: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Status: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ConsumerRegion: {
                        type: "object",
                        additionalProperties: true,
                      },
                      CreatedDate: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StatusChangeDate: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ProducerAllowedWrites: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ConsumerAcceptedWrites: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ManagedBy: {
                  type: "string",
                },
                DataShareType: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The results returned from describing datashares.",
          },
          Marker: {
            type: "string",
            description:
              "An optional parameter that specifies the starting point to return a set of response records.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDataShares;
