import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, GetBucketLocationCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const getBucketLocation: AppBlock = {
  name: "Get Bucket Location",
  description: `Using the GetBucketLocation operation is no longer a best practice.`,
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
          description: "The name of the bucket for which to get the location.",
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

        const command = new GetBucketLocationCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Bucket Location Result",
      description: "Result from GetBucketLocation operation",
      possiblePrimaryParents: ["default"],
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
            description: "Specifies the Region where the bucket resides.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getBucketLocation;
