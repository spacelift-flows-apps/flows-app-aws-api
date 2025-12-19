import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, CreateSessionCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const createSession: AppBlock = {
  name: "Create Session",
  description: `Creates a session that establishes temporary security credentials to support fast authentication and authorization for the Zonal endpoint API operations on directory buckets.`,
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
        SessionMode: {
          name: "Session Mode",
          description:
            "Specifies the mode of the session that will be created, either ReadWrite or ReadOnly.",
          type: "string",
          required: false,
        },
        Bucket: {
          name: "Bucket",
          description: "The name of the bucket that you create a session for.",
          type: "string",
          required: true,
        },
        ServerSideEncryption: {
          name: "Server Side Encryption",
          description:
            "The server-side encryption algorithm to use when you store objects in the directory bucket.",
          type: "string",
          required: false,
        },
        SSEKMSKeyId: {
          name: "SSEKMS Key Id",
          description:
            "If you specify x-amz-server-side-encryption with aws:kms, you must specify the x-amz-server-side-encryption-aws-kms-key-id header with the ID (Key ID or Key ARN) of the KMS symmetric encryption customer managed key to use.",
          type: "string",
          required: false,
        },
        SSEKMSEncryptionContext: {
          name: "SSEKMS Encryption Context",
          description:
            "Specifies the Amazon Web Services KMS Encryption Context as an additional encryption context to use for object encryption.",
          type: "string",
          required: false,
        },
        BucketKeyEnabled: {
          name: "Bucket Key Enabled",
          description:
            "Specifies whether Amazon S3 should use an S3 Bucket Key for object encryption with server-side encryption using KMS keys (SSE-KMS).",
          type: "boolean",
          required: false,
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateSessionCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Session Result",
      description: "Result from CreateSession operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServerSideEncryption: {
            type: "string",
            description:
              "The server-side encryption algorithm used when you store objects in the directory bucket.",
          },
          SSEKMSKeyId: {
            type: "string",
            description:
              "If you specify x-amz-server-side-encryption with aws:kms, this header indicates the ID of the KMS symmetric encryption customer managed key that was used for object encryption.",
          },
          SSEKMSEncryptionContext: {
            type: "string",
            description:
              "If present, indicates the Amazon Web Services KMS Encryption Context to use for object encryption.",
          },
          BucketKeyEnabled: {
            type: "boolean",
            description:
              "Indicates whether to use an S3 Bucket Key for server-side encryption with KMS keys (SSE-KMS).",
          },
          Credentials: {
            type: "object",
            properties: {
              AccessKeyId: {
                type: "string",
              },
              SecretAccessKey: {
                type: "string",
              },
              SessionToken: {
                type: "string",
              },
              Expiration: {
                type: "string",
              },
            },
            required: [
              "AccessKeyId",
              "SecretAccessKey",
              "SessionToken",
              "Expiration",
            ],
            additionalProperties: false,
            description:
              "The established temporary security credentials for the created session.",
          },
        },
        required: ["Credentials"],
      },
    },
  },
};

export default createSession;
