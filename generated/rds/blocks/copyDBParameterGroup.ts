import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, CopyDBParameterGroupCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const copyDBParameterGroup: AppBlock = {
  name: "Copy DB Parameter Group",
  description: `Copies the specified DB parameter group.`,
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
        SourceDBParameterGroupIdentifier: {
          name: "Source DB Parameter Group Identifier",
          description:
            "The identifier or ARN for the source DB parameter group.",
          type: "string",
          required: true,
        },
        TargetDBParameterGroupIdentifier: {
          name: "Target DB Parameter Group Identifier",
          description: "The identifier for the copied DB parameter group.",
          type: "string",
          required: true,
        },
        TargetDBParameterGroupDescription: {
          name: "Target DB Parameter Group Description",
          description: "A description for the copied DB parameter group.",
          type: "string",
          required: true,
        },
        Tags: {
          name: "Tags",
          description: "A list of tags.",
          type: {
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
          },
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CopyDBParameterGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Copy DB Parameter Group Result",
      description: "Result from CopyDBParameterGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DBParameterGroup: {
            type: "object",
            properties: {
              DBParameterGroupName: {
                type: "string",
              },
              DBParameterGroupFamily: {
                type: "string",
              },
              Description: {
                type: "string",
              },
              DBParameterGroupArn: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "Contains the details of an Amazon RDS DB parameter group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default copyDBParameterGroup;
