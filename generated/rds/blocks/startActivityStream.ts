import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, StartActivityStreamCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startActivityStream: AppBlock = {
  name: "Start Activity Stream",
  description: `Starts a database activity stream to monitor activity on the database.`,
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
        ResourceArn: {
          name: "Resource Arn",
          description:
            "The Amazon Resource Name (ARN) of the DB cluster, for example, arn:aws:rds:us-east-1:12345667890:cluster:das-cluster.",
          type: "string",
          required: true,
        },
        Mode: {
          name: "Mode",
          description: "Specifies the mode of the database activity stream.",
          type: "string",
          required: true,
        },
        KmsKeyId: {
          name: "Kms Key Id",
          description:
            "The Amazon Web Services KMS key identifier for encrypting messages in the database activity stream.",
          type: "string",
          required: true,
        },
        ApplyImmediately: {
          name: "Apply Immediately",
          description:
            "Specifies whether or not the database activity stream is to start as soon as possible, regardless of the maintenance window for the database.",
          type: "boolean",
          required: false,
        },
        EngineNativeAuditFieldsIncluded: {
          name: "Engine Native Audit Fields Included",
          description:
            "Specifies whether the database activity stream includes engine-native audit fields.",
          type: "boolean",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new StartActivityStreamCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Activity Stream Result",
      description: "Result from StartActivityStream operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          KmsKeyId: {
            type: "string",
            description:
              "The Amazon Web Services KMS key identifier for encryption of messages in the database activity stream.",
          },
          KinesisStreamName: {
            type: "string",
            description:
              "The name of the Amazon Kinesis data stream to be used for the database activity stream.",
          },
          Status: {
            type: "string",
            description: "The status of the database activity stream.",
          },
          Mode: {
            type: "string",
            description: "The mode of the database activity stream.",
          },
          ApplyImmediately: {
            type: "boolean",
            description:
              "Indicates whether or not the database activity stream will start as soon as possible, regardless of the maintenance window for the database.",
          },
          EngineNativeAuditFieldsIncluded: {
            type: "boolean",
            description:
              "Indicates whether engine-native audit fields are included in the database activity stream.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startActivityStream;
