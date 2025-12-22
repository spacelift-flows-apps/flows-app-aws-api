import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const deleteObjects: AppBlock = {
  name: "Delete Objects",
  description: `This operation enables you to delete multiple objects from a bucket using a single HTTP request.`,
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
          description: "The bucket name containing the objects to delete.",
          type: "string",
          required: true,
        },
        Delete: {
          name: "Delete",
          description: "Container for the request.",
          type: {
            type: "object",
            properties: {
              Objects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    VersionId: {
                      type: "string",
                    },
                    ETag: {
                      type: "string",
                    },
                    LastModifiedTime: {
                      type: "string",
                    },
                    Size: {
                      type: "number",
                    },
                  },
                  required: ["Key"],
                  additionalProperties: false,
                },
              },
              Quiet: {
                type: "boolean",
              },
            },
            required: ["Objects"],
            additionalProperties: false,
          },
          required: true,
        },
        MFA: {
          name: "MFA",
          description:
            "The concatenation of the authentication device's serial number, a space, and the value that is displayed on your authentication device.",
          type: "string",
          required: false,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: "string",
          required: false,
        },
        BypassGovernanceRetention: {
          name: "Bypass Governance Retention",
          description:
            "Specifies whether you want to delete this object even if it has a Governance-type Object Lock in place.",
          type: "boolean",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        ChecksumAlgorithm: {
          name: "Checksum Algorithm",
          description:
            "Indicates the algorithm used to create the checksum for the object when you use the SDK.",
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

        const command = new DeleteObjectsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Objects Result",
      description: "Result from DeleteObjects operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Deleted: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                DeleteMarker: {
                  type: "boolean",
                },
                DeleteMarkerVersionId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Container element for a successful delete.",
          },
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
          Errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                Code: {
                  type: "string",
                },
                Message: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Container for a failed delete action that describes the object that Amazon S3 attempted to delete and the error it encountered.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteObjects;
