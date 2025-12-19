import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  AssociateEnclaveCertificateIamRoleCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateEnclaveCertificateIamRole: AppBlock = {
  name: "Associate Enclave Certificate Iam Role",
  description: `Associates an Identity and Access Management (IAM) role with an Certificate Manager (ACM) certificate.`,
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
        CertificateArn: {
          name: "Certificate Arn",
          description:
            "The ARN of the ACM certificate with which to associate the IAM role.",
          type: "string",
          required: true,
        },
        RoleArn: {
          name: "Role Arn",
          description:
            "The ARN of the IAM role to associate with the ACM certificate.",
          type: "string",
          required: true,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AssociateEnclaveCertificateIamRoleCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Enclave Certificate Iam Role Result",
      description: "Result from AssociateEnclaveCertificateIamRole operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CertificateS3BucketName: {
            type: "string",
            description:
              "The name of the Amazon S3 bucket to which the certificate was uploaded.",
          },
          CertificateS3ObjectKey: {
            type: "string",
            description:
              "The Amazon S3 object key where the certificate, certificate chain, and encrypted private key bundle are stored.",
          },
          EncryptionKmsKeyId: {
            type: "string",
            description:
              "The ID of the KMS key used to encrypt the private key of the certificate.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateEnclaveCertificateIamRole;
