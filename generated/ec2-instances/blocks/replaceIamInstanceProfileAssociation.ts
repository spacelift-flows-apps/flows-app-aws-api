import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ReplaceIamInstanceProfileAssociationCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const replaceIamInstanceProfileAssociation: AppBlock = {
  name: "Replace Iam Instance Profile Association",
  description: `Replaces an IAM instance profile for the specified running instance.`,
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
        IamInstanceProfile: {
          name: "Iam Instance Profile",
          description: "The IAM instance profile.",
          type: {
            type: "object",
            properties: {
              Arn: {
                type: "string",
              },
              Name: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        AssociationId: {
          name: "Association Id",
          description:
            "The ID of the existing IAM instance profile association.",
          type: "string",
          required: true,
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

        const command = new ReplaceIamInstanceProfileAssociationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Replace Iam Instance Profile Association Result",
      description: "Result from ReplaceIamInstanceProfileAssociation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IamInstanceProfileAssociation: {
            type: "object",
            properties: {
              AssociationId: {
                type: "string",
              },
              InstanceId: {
                type: "string",
              },
              IamInstanceProfile: {
                type: "object",
                properties: {
                  Arn: {
                    type: "string",
                  },
                  Id: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              State: {
                type: "string",
              },
              Timestamp: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Information about the IAM instance profile association.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default replaceIamInstanceProfileAssociation;
