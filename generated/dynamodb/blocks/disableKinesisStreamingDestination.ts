import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  DisableKinesisStreamingDestinationCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const disableKinesisStreamingDestination: AppBlock = {
  name: "Disable Kinesis Streaming Destination",
  description: `Stops replication from the DynamoDB table to the Kinesis data stream.`,
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
          description: "The name of the DynamoDB table.",
          type: "string",
          required: true,
        },
        StreamArn: {
          name: "Stream Arn",
          description: "The ARN for a Kinesis data stream.",
          type: "string",
          required: true,
        },
        EnableKinesisStreamingConfiguration: {
          name: "Enable Kinesis Streaming Configuration",
          description:
            "The source for the Kinesis streaming information that is being enabled.",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DisableKinesisStreamingDestinationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Disable Kinesis Streaming Destination Result",
      description: "Result from DisableKinesisStreamingDestination operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TableName: {
            type: "string",
            description: "The name of the table being modified.",
          },
          StreamArn: {
            type: "string",
            description: "The ARN for the specific Kinesis data stream.",
          },
          DestinationStatus: {
            type: "string",
            description: "The current status of the replication.",
          },
          EnableKinesisStreamingConfiguration: {
            type: "object",
            properties: {
              ApproximateCreationDateTimePrecision: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The destination for the Kinesis streaming information that is being enabled.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default disableKinesisStreamingDestination;
