import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, PutObjectAclCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putObjectAcl: AppBlock = {
  name: "Put Object Acl",
  description: `This operation is not supported for directory buckets.`,
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
          description: "The canned ACL to apply to the object.",
          type: "string",
          required: false,
        },
        AccessControlPolicy: {
          name: "Access Control Policy",
          description:
            "Contains the elements that set the ACL permissions for an object per grantee.",
          type: {
            type: "object",
            properties: {
              Grants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Grantee: {
                      type: "object",
                      properties: {
                        DisplayName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        EmailAddress: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ID: {
                          type: "object",
                          additionalProperties: true,
                        },
                        URI: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Type: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Type"],
                      additionalProperties: false,
                    },
                    Permission: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              Owner: {
                type: "object",
                properties: {
                  DisplayName: {
                    type: "string",
                  },
                  ID: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        Bucket: {
          name: "Bucket",
          description:
            "The bucket name that contains the object to which you want to attach the ACL.",
          type: "string",
          required: true,
        },
        ContentMD5: {
          name: "Content MD5",
          description: "The Base64 encoded 128-bit MD5 digest of the data.",
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
        Key: {
          name: "Key",
          description: "Key for which the PUT action was initiated.",
          type: "string",
          required: true,
        },
        RequestPayer: {
          name: "Request Payer",
          description:
            "Confirms that the requester knows that they will be charged for the request.",
          type: "string",
          required: false,
        },
        VersionId: {
          name: "Version Id",
          description:
            "Version ID used to reference a specific version of the object.",
          type: "string",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
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

        const command = new PutObjectAclCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Object Acl Result",
      description: "Result from PutObjectAcl operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RequestCharged: {
            type: "string",
            description:
              "If present, indicates that the requester was successfully charged for the request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putObjectAcl;
