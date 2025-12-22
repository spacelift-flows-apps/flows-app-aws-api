import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  RejectDataShareCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const rejectDataShare: AppBlock = {
  name: "Reject Data Share",
  description: `From a datashare consumer account, rejects the specified datashare.`,
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
            "The Amazon Resource Name (ARN) of the datashare to reject.",
          type: "string",
          required: true,
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

        const command = new RejectDataShareCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Reject Data Share Result",
      description: "Result from RejectDataShare operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DataShareArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the datashare that the consumer is to use.",
          },
          ProducerArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the producer namespace.",
          },
          AllowPubliclyAccessibleConsumers: {
            type: "boolean",
            description:
              "A value that specifies whether the datashare can be shared to a publicly accessible cluster.",
          },
          DataShareAssociations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ConsumerIdentifier: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                ConsumerRegion: {
                  type: "string",
                },
                CreatedDate: {
                  type: "string",
                },
                StatusChangeDate: {
                  type: "string",
                },
                ProducerAllowedWrites: {
                  type: "boolean",
                },
                ConsumerAcceptedWrites: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "A value that specifies when the datashare has an association between producer and data consumers.",
          },
          ManagedBy: {
            type: "string",
            description:
              "The identifier of a datashare to show its managing entity.",
          },
          DataShareType: {
            type: "string",
            description:
              "The type of the datashare created by RegisterNamespace.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default rejectDataShare;
