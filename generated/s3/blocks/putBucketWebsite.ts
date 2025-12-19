import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, PutBucketWebsiteCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const putBucketWebsite: AppBlock = {
  name: "Put Bucket Website",
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
        Bucket: {
          name: "Bucket",
          description: "The bucket name.",
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
            "Indicates the algorithm used to create the checksum for the request when you use the SDK.",
          type: "string",
          required: false,
        },
        WebsiteConfiguration: {
          name: "Website Configuration",
          description: "Container for the request.",
          type: {
            type: "object",
            properties: {
              ErrorDocument: {
                type: "object",
                properties: {
                  Key: {
                    type: "string",
                  },
                },
                required: ["Key"],
                additionalProperties: false,
              },
              IndexDocument: {
                type: "object",
                properties: {
                  Suffix: {
                    type: "string",
                  },
                },
                required: ["Suffix"],
                additionalProperties: false,
              },
              RedirectAllRequestsTo: {
                type: "object",
                properties: {
                  HostName: {
                    type: "string",
                  },
                  Protocol: {
                    type: "string",
                  },
                },
                required: ["HostName"],
                additionalProperties: false,
              },
              RoutingRules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Condition: {
                      type: "object",
                      properties: {
                        HttpErrorCodeReturnedEquals: {
                          type: "object",
                          additionalProperties: true,
                        },
                        KeyPrefixEquals: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                    Redirect: {
                      type: "object",
                      properties: {
                        HostName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HttpRedirectCode: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Protocol: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplaceKeyPrefixWith: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ReplaceKeyWith: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  required: ["Redirect"],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
          required: true,
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

        const command = new PutBucketWebsiteCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Bucket Website Result",
      description: "Result from PutBucketWebsite operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

export default putBucketWebsite;
