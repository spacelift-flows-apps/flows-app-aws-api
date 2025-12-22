import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetAssociatedEnclaveCertificateIamRolesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getAssociatedEnclaveCertificateIamRoles: AppBlock = {
  name: "Get Associated Enclave Certificate Iam Roles",
  description: `Returns the IAM roles that are associated with the specified ACM (ACM) certificate.`,
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
            "The ARN of the ACM certificate for which to view the associated IAM roles, encryption keys, and Amazon S3 object information.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetAssociatedEnclaveCertificateIamRolesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Associated Enclave Certificate Iam Roles Result",
      description:
        "Result from GetAssociatedEnclaveCertificateIamRoles operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssociatedRoles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                AssociatedRoleArn: {
                  type: "string",
                },
                CertificateS3BucketName: {
                  type: "string",
                },
                CertificateS3ObjectKey: {
                  type: "string",
                },
                EncryptionKmsKeyId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the associated IAM roles.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getAssociatedEnclaveCertificateIamRoles;
