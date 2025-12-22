import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listBuckets: AppBlock = {
  name: "List Buckets",
  description: `End of support notice: Beginning October 1, 2025, Amazon S3 will stop returning DisplayName.`,
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
        MaxBuckets: {
          name: "Max Buckets",
          description: "Maximum number of buckets to be returned in response.",
          type: "number",
          required: false,
        },
        ContinuationToken: {
          name: "Continuation Token",
          description:
            "ContinuationToken indicates to Amazon S3 that the list is being continued on this bucket with a token.",
          type: "string",
          required: false,
        },
        Prefix: {
          name: "Prefix",
          description:
            "Limits the response to bucket names that begin with the specified bucket name prefix.",
          type: "string",
          required: false,
        },
        BucketRegion: {
          name: "Bucket Region",
          description:
            "Limits the response to buckets that are located in the specified Amazon Web Services Region.",
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

        const command = new ListBucketsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Buckets Result",
      description: "Result from ListBuckets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Buckets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                CreationDate: {
                  type: "string",
                },
                BucketRegion: {
                  type: "string",
                },
                BucketArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of buckets owned by the requester.",
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
            description: "The owner of the buckets listed.",
          },
          ContinuationToken: {
            type: "string",
            description:
              "ContinuationToken is included in the response when there are more buckets that can be listed with pagination.",
          },
          Prefix: {
            type: "string",
            description:
              "If Prefix was sent with the request, it is included in the response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listBuckets;
