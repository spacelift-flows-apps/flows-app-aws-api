import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, ListDirectoryBucketsCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const listDirectoryBuckets: AppBlock = {
  name: "List Directory Buckets",
  description: `Returns a list of all Amazon S3 directory buckets owned by the authenticated sender of the request.`,
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
        ContinuationToken: {
          name: "Continuation Token",
          description:
            "ContinuationToken indicates to Amazon S3 that the list is being continued on buckets in this account with a token.",
          type: "string",
          required: false,
        },
        MaxDirectoryBuckets: {
          name: "Max Directory Buckets",
          description: "Maximum number of buckets to be returned in response.",
          type: "number",
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

        const command = new ListDirectoryBucketsCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Directory Buckets Result",
      description: "Result from ListDirectoryBuckets operation",
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
          ContinuationToken: {
            type: "string",
            description:
              "If ContinuationToken was sent with the request, it is included in the response.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDirectoryBuckets;
