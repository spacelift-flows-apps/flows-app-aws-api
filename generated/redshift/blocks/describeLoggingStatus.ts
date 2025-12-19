import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  DescribeLoggingStatusCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeLoggingStatus: AppBlock = {
  name: "Describe Logging Status",
  description: `Describes whether information, such as queries and connection attempts, is being logged for the specified Amazon Redshift cluster.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The identifier of the cluster from which to get the logging status.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeLoggingStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Logging Status Result",
      description: "Result from DescribeLoggingStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LoggingEnabled: {
            type: "boolean",
            description: "true if logging is on, false if logging is off.",
          },
          BucketName: {
            type: "string",
            description:
              "The name of the S3 bucket where the log files are stored.",
          },
          S3KeyPrefix: {
            type: "string",
            description: "The prefix applied to the log file names.",
          },
          LastSuccessfulDeliveryTime: {
            type: "string",
            description: "The last time that logs were delivered.",
          },
          LastFailureTime: {
            type: "string",
            description: "The last time when logs failed to be delivered.",
          },
          LastFailureMessage: {
            type: "string",
            description:
              "The message indicating that logs failed to be delivered.",
          },
          LogDestinationType: {
            type: "string",
            description: "The log destination type.",
          },
          LogExports: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The collection of exported log types.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeLoggingStatus;
