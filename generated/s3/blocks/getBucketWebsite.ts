import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, GetBucketWebsiteCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketWebsite: AppBlock = {
  name: "Get Bucket Website",
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
          description:
            "The bucket name for which to get the website configuration.",
          type: "string",
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

        const command = new GetBucketWebsiteCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Bucket Website Result",
      description: "Result from GetBucketWebsite operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
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
            description:
              "Specifies the redirect behavior of all requests to a website endpoint of an Amazon S3 bucket.",
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
            description:
              "The name of the index document for the website (for example index.",
          },
          ErrorDocument: {
            type: "object",
            properties: {
              Key: {
                type: "string",
              },
            },
            required: ["Key"],
            additionalProperties: false,
            description:
              "The object key name of the website error document to use for 4XX class errors.",
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
                      type: "string",
                    },
                    KeyPrefixEquals: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Redirect: {
                  type: "object",
                  properties: {
                    HostName: {
                      type: "string",
                    },
                    HttpRedirectCode: {
                      type: "string",
                    },
                    Protocol: {
                      type: "string",
                    },
                    ReplaceKeyPrefixWith: {
                      type: "string",
                    },
                    ReplaceKeyWith: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Redirect"],
              additionalProperties: false,
            },
            description:
              "Rules that define when a redirect is applied and the redirect behavior.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketWebsite;
