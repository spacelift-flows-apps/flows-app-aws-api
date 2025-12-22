import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  UpdateKinesisStreamingDestinationCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateKinesisStreamingDestination: AppBlock = {
  name: "Update Kinesis Streaming Destination",
  description: `The command to update the Kinesis stream destination.`,
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
        TableName: {
          name: "Table Name",
          description:
            "The table name for the Kinesis streaming destination input.",
          type: "string",
          required: true,
        },
        StreamArn: {
          name: "Stream Arn",
          description:
            "The Amazon Resource Name (ARN) for the Kinesis stream input.",
          type: "string",
          required: true,
        },
        UpdateKinesisStreamingConfiguration: {
          name: "Update Kinesis Streaming Configuration",
          description:
            "The command to update the Kinesis stream configuration.",
          type: {
            type: "object",
            properties: {
              ApproximateCreationDateTimePrecision: {
                type: "string",
              },
            },
            additionalProperties: false,
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdateKinesisStreamingDestinationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Kinesis Streaming Destination Result",
      description: "Result from UpdateKinesisStreamingDestination operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableName: {
            type: "string",
            description:
              "The table name for the Kinesis streaming destination output.",
          },
          StreamArn: {
            type: "string",
            description: "The ARN for the Kinesis stream input.",
          },
          DestinationStatus: {
            type: "string",
            description:
              "The status of the attempt to update the Kinesis streaming destination output.",
          },
          UpdateKinesisStreamingConfiguration: {
            type: "object",
            properties: {
              ApproximateCreationDateTimePrecision: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The command to update the Kinesis streaming destination configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateKinesisStreamingDestination;
