import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudWatchLogsClient,
  AssociateSourceToS3TableIntegrationCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateSourceToS3TableIntegration: AppBlock = {
  name: "Associate Source To S3Table Integration",
  description: `Associates a data source with an S3 Table Integration for query access in the 'logs' namespace.`,
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
        integrationArn: {
          name: "integration Arn",
          description:
            "The Amazon Resource Name (ARN) of the S3 Table Integration to associate the data source with.",
          type: "string",
          required: true,
        },
        dataSource: {
          name: "data Source",
          description:
            "The data source to associate with the S3 Table Integration.",
          type: {
            type: "object",
            properties: {
              name: {
                type: "string",
              },
              type: {
                type: "string",
              },
            },
            required: ["name"],
            additionalProperties: false,
          },
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

        const client = new CloudWatchLogsClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AssociateSourceToS3TableIntegrationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Source To S3Table Integration Result",
      description: "Result from AssociateSourceToS3TableIntegration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description:
              "The unique identifier for the association between the data source and S3 Table Integration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateSourceToS3TableIntegration;
