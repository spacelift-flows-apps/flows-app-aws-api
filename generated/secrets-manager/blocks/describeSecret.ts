import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSecret: AppBlock = {
  name: "Describe Secret",
  description: `Retrieves the details of a secret.`,
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
        SecretId: {
          name: "Secret Id",
          description: "The ARN or name of the secret.",
          type: "string",
          required: true,
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

        const client = new SecretsManagerClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeSecretCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Secret Result",
      description: "Result from DescribeSecret operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ARN: {
            type: "string",
            description: "The ARN of the secret.",
          },
          Name: {
            type: "string",
            description: "The name of the secret.",
          },
          Description: {
            type: "string",
            description: "The description of the secret.",
          },
          KmsKeyId: {
            type: "string",
            description:
              "The key ID or alias ARN of the KMS key that Secrets Manager uses to encrypt the secret value.",
          },
          RotationEnabled: {
            type: "boolean",
            description:
              "Specifies whether automatic rotation is turned on for this secret.",
          },
          RotationLambdaARN: {
            type: "string",
            description:
              "The ARN of the Lambda function that Secrets Manager invokes to rotate the secret.",
          },
          RotationRules: {
            type: "object",
            properties: {
              AutomaticallyAfterDays: {
                type: "number",
              },
              Duration: {
                type: "string",
              },
              ScheduleExpression: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The rotation schedule and Lambda function for this secret.",
          },
          LastRotatedDate: {
            type: "string",
            description:
              "The last date and time that Secrets Manager rotated the secret.",
          },
          LastChangedDate: {
            type: "string",
            description:
              "The last date and time that this secret was modified in any way.",
          },
          LastAccessedDate: {
            type: "string",
            description:
              "The date that the secret was last accessed in the Region.",
          },
          DeletedDate: {
            type: "string",
            description: "The date the secret is scheduled for deletion.",
          },
          NextRotationDate: {
            type: "string",
            description:
              "The next rotation is scheduled to occur on or before this date.",
          },
          Tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The list of tags attached to the secret.",
          },
          VersionIdsToStages: {
            type: "object",
            additionalProperties: {
              type: "array",
            },
            description:
              "A list of the versions of the secret that have staging labels attached.",
          },
          OwningService: {
            type: "string",
            description: "The ID of the service that created this secret.",
          },
          CreatedDate: {
            type: "string",
            description: "The date the secret was created.",
          },
          PrimaryRegion: {
            type: "string",
            description: "The Region the secret is in.",
          },
          ReplicationStatus: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Region: {
                  type: "string",
                },
                KmsKeyId: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                LastAccessedDate: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of the replicas of this secret and their status: Failed, which indicates that the replica was not created.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSecret;
