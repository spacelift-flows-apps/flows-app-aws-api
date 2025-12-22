import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListTypeVersionsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTypeVersions: AppBlock = {
  name: "List Type Versions",
  description: `Returns summary information about the versions of an extension.`,
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
        Type: {
          name: "Type",
          description: "The kind of the extension.",
          type: "string",
          required: false,
        },
        TypeName: {
          name: "Type Name",
          description:
            "The name of the extension for which you want version summary information.",
          type: "string",
          required: false,
        },
        Arn: {
          name: "Arn",
          description:
            "The Amazon Resource Name (ARN) of the extension for which you want version summary information.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to be returned with a single call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "If the previous paginated request didn't return all of the remaining results, the response object's NextToken parameter value is set to a token.",
          type: "string",
          required: false,
        },
        DeprecatedStatus: {
          name: "Deprecated Status",
          description:
            "The deprecation status of the extension versions that you want to get summary information about.",
          type: "string",
          required: false,
        },
        PublisherId: {
          name: "Publisher Id",
          description: "The publisher ID of the extension publisher.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListTypeVersionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Type Versions Result",
      description: "Result from ListTypeVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TypeVersionSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                TypeName: {
                  type: "string",
                },
                VersionId: {
                  type: "string",
                },
                IsDefaultVersion: {
                  type: "boolean",
                },
                Arn: {
                  type: "string",
                },
                TimeCreated: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                PublicVersionNumber: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of TypeVersionSummary structures that contain information about the specified extension's versions.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all of the remaining results, NextToken is set to a token.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTypeVersions;
