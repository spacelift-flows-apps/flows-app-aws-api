import { AppBlock, events } from "@slflows/sdk/v1";
import {
  S3Client,
  CreateBucketMetadataTableConfigurationCommand,
} from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const createBucketMetadataTableConfiguration: AppBlock = {
  name: "Create Bucket Metadata Table Configuration",
  description: `We recommend that you create your S3 Metadata configurations by using the V2 CreateBucketMetadataConfiguration API operation.`,
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
        Bucket: {
          name: "Bucket",
          description:
            "The general purpose bucket that you want to create the metadata table configuration for.",
          type: "string",
          required: true,
        },
        ContentMD5: {
          name: "Content MD5",
          description:
            "The Content-MD5 header for the metadata table configuration.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "The checksum algorithm to use with your metadata table configuration.",
          type: "string",
          required: false,
        },
        MetadataTableConfiguration: {
          name: "Metadata Table Configuration",
          description: "The contents of your metadata table configuration.",
          type: {
            type: "object",
            properties: {
              S3TablesDestination: {
                type: "object",
                properties: {
                  TableBucketArn: {
                    type: "string",
                  },
                  TableName: {
                    type: "string",
                  },
                },
                required: ["TableBucketArn", "TableName"],
                additionalProperties: false,
              },
            },
            required: ["S3TablesDestination"],
            additionalProperties: false,
          },
          required: true,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description:
            "The expected owner of the general purpose bucket that corresponds to your metadata table configuration.",
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateBucketMetadataTableConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Bucket Metadata Table Configuration Result",
      description:
        "Result from CreateBucketMetadataTableConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default createBucketMetadataTableConfiguration;
