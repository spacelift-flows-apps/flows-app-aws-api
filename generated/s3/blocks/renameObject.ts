import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, RenameObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const renameObject: AppBlock = {
  name: "Rename Object",
  description: `Renames an existing object in a directory bucket that uses the S3 Express One Zone storage class.`,
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
            "The bucket name of the directory bucket containing the object.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description: "Key name of the object to rename.",
          type: "string",
          required: true,
        },
        RenameSource: {
          name: "Rename Source",
          description: "Specifies the source for the rename operation.",
          type: "string",
          required: true,
        },
        DestinationIfMatch: {
          name: "Destination If Match",
          description:
            "Renames the object only if the ETag (entity tag) value provided during the operation matches the ETag of the object in S3.",
          type: "string",
          required: false,
        },
        DestinationIfNoneMatch: {
          name: "Destination If None Match",
          description:
            "Renames the object only if the destination does not already exist in the specified directory bucket.",
          type: "string",
          required: false,
        },
        DestinationIfModifiedSince: {
          name: "Destination If Modified Since",
          description:
            "Renames the object if the destination exists and if it has been modified since the specified time.",
          type: "string",
          required: false,
        },
        DestinationIfUnmodifiedSince: {
          name: "Destination If Unmodified Since",
          description:
            "Renames the object if it hasn't been modified since the specified time.",
          type: "string",
          required: false,
        },
        SourceIfMatch: {
          name: "Source If Match",
          description:
            "Renames the object if the source exists and if its entity tag (ETag) matches the specified ETag.",
          type: "string",
          required: false,
        },
        SourceIfNoneMatch: {
          name: "Source If None Match",
          description:
            "Renames the object if the source exists and if its entity tag (ETag) is different than the specified ETag.",
          type: "string",
          required: false,
        },
        SourceIfModifiedSince: {
          name: "Source If Modified Since",
          description:
            "Renames the object if the source exists and if it has been modified since the specified time.",
          type: "string",
          required: false,
        },
        SourceIfUnmodifiedSince: {
          name: "Source If Unmodified Since",
          description:
            "Renames the object if the source exists and hasn't been modified since the specified time.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "A unique string with a max of 64 ASCII characters in the ASCII range of 33 - 126.",
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new RenameObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Rename Object Result",
      description: "Result from RenameObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default renameObject;
