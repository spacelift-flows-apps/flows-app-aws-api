import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const createBucket: AppBlock = {
  name: "Create Bucket",
  description: `This action creates an Amazon S3 bucket.`,
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
        ACL: {
          name: "ACL",
          description: "The canned ACL to apply to the bucket.",
          type: {
            type: "string",
            enum: [
              "private",
              "public-read",
              "public-read-write",
              "authenticated-read",
            ],
          },
          required: false,
        },
        Bucket: {
          name: "Bucket",
          description: "The name of the bucket to create.",
          type: "string",
          required: true,
        },
        CreateBucketConfiguration: {
          name: "Create Bucket Configuration",
          description: "The configuration information for the bucket.",
          type: {
            type: "object",
            properties: {
              LocationConstraint: {
                type: "string",
                enum: [
                  "af-south-1",
                  "ap-east-1",
                  "ap-east-2",
                  "ap-northeast-1",
                  "ap-northeast-2",
                  "ap-northeast-3",
                  "ap-south-1",
                  "ap-south-2",
                  "ap-southeast-1",
                  "ap-southeast-2",
                  "ap-southeast-3",
                  "ap-southeast-4",
                  "ap-southeast-5",
                  "ap-southeast-6",
                  "ap-southeast-7",
                  "ca-central-1",
                  "ca-west-1",
                  "cn-north-1",
                  "cn-northwest-1",
                  "EU",
                  "eu-central-1",
                  "eu-central-2",
                  "eu-north-1",
                  "eu-south-1",
                  "eu-south-2",
                  "eu-west-1",
                  "eu-west-2",
                  "eu-west-3",
                  "il-central-1",
                  "me-central-1",
                  "me-south-1",
                  "mx-central-1",
                  "sa-east-1",
                  "us-east-2",
                  "us-gov-east-1",
                  "us-gov-west-1",
                  "us-west-1",
                  "us-west-2",
                ],
              },
              Location: {
                type: "object",
                properties: {
                  Type: {
                    type: "string",
                    enum: ["AvailabilityZone", "LocalZone"],
                  },
                  Name: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              Bucket: {
                type: "object",
                properties: {
                  DataRedundancy: {
                    type: "string",
                    enum: ["SingleAvailabilityZone", "SingleLocalZone"],
                  },
                  Type: {
                    type: "string",
                    enum: ["Directory"],
                  },
                },
                additionalProperties: false,
              },
              Tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  required: ["Key", "Value"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        GrantFullControl: {
          name: "Grant Full Control",
          description:
            "Allows grantee the read, write, read ACP, and write ACP permissions on the bucket.",
          type: "string",
          required: false,
        },
        GrantRead: {
          name: "Grant Read",
          description: "Allows grantee to list the objects in the bucket.",
          type: "string",
          required: false,
        },
        GrantReadACP: {
          name: "Grant Read ACP",
          description: "Allows grantee to read the bucket ACL.",
          type: "string",
          required: false,
        },
        GrantWrite: {
          name: "Grant Write",
          description: "Allows grantee to create new objects in the bucket.",
          type: "string",
          required: false,
        },
        GrantWriteACP: {
          name: "Grant Write ACP",
          description:
            "Allows grantee to write the ACL for the applicable bucket.",
          type: "string",
          required: false,
        },
        ObjectLockEnabledForBucket: {
          name: "Object Lock Enabled For Bucket",
          description:
            "Specifies whether you want S3 Object Lock to be enabled for the new bucket.",
          type: "boolean",
          required: false,
        },
        ObjectOwnership: {
          name: "Object Ownership",
          description:
            "The container element for object ownership for a bucket's ownership controls.",
          type: {
            type: "string",
            enum: [
              "BucketOwnerPreferred",
              "ObjectWriter",
              "BucketOwnerEnforced",
            ],
          },
          required: false,
        },
        BucketNamespace: {
          name: "Bucket Namespace",
          description:
            "Specifies the namespace where you want to create your general purpose bucket.",
          type: {
            type: "string",
            enum: ["account-regional", "global"],
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

        const client = new S3Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateBucketCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Bucket Result",
      description: "Result from CreateBucket operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Location: {
            type: "string",
            description: "A forward slash followed by the name of the bucket.",
          },
          BucketArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the S3 bucket.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createBucket;
