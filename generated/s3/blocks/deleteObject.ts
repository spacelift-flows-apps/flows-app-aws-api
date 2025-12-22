import { AppBlock, events } from "@slflows/sdk/v1";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";

const deleteObject: AppBlock = {
  name: "Delete Object",
  description: `Removes an object from a bucket.`,
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
          description: "The bucket name of the bucket containing the object.",
          type: "string",
          required: true,
        },
        Key: {
          name: "Key",
          description: "Key name of the object to delete.",
          type: "string",
          required: true,
        },
        MFA: {
          name: "MFA",
          description:
            "The concatenation of the authentication device's serial number, a space, and the value that is displayed on your authentication device.",
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
            "Indicates whether S3 Object Lock should bypass Governance-mode restrictions to process this operation.",
          type: "boolean",
          required: false,
        },
        ExpectedBucketOwner: {
          name: "Expected Bucket Owner",
          description: "The account ID of the expected bucket owner.",
          type: "string",
          required: false,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The If-Match header field makes the request method conditional on ETags.",
          type: "string",
          required: false,
        },
        IfMatchLastModifiedTime: {
          name: "If Match Last Modified Time",
          description:
            "If present, the object is deleted only if its modification times matches the provided Timestamp.",
          type: "string",
          required: false,
        },
        IfMatchSize: {
          name: "If Match Size",
          description:
            "If present, the object is deleted only if its size matches the provided size in bytes.",
          type: "number",
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

        const command = new DeleteObjectCommand(commandInput as any);
        const response = await client.send(command);

        // Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Object Result",
      description: "Result from DeleteObject operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DeleteMarker: {
            type: "boolean",
            description:
              "Indicates whether the specified object version that was permanently deleted was (true) or was not (false) a delete marker before deletion.",
          },
          VersionId: {
            type: "string",
            description:
              "Returns the version ID of the delete marker created as a result of the DELETE operation.",
          },
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

export default deleteObject;
