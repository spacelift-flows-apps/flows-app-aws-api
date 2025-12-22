import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  ListTypesCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTypes: AppBlock = {
  name: "List Types",
  description: `Returns summary information about extension that have been registered with CloudFormation.`,
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
        Visibility: {
          name: "Visibility",
          description:
            "The scope at which the extensions are visible and usable in CloudFormation operations.",
          type: "string",
          required: false,
        },
        ProvisioningType: {
          name: "Provisioning Type",
          description:
            "For resource types, the provisioning behavior of the resource type.",
          type: "string",
          required: false,
        },
        DeprecatedStatus: {
          name: "Deprecated Status",
          description:
            "The deprecation status of the extension that you want to get summary information about.",
          type: "string",
          required: false,
        },
        Type: {
          name: "Type",
          description: "The type of extension.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description:
            "Filter criteria to use in determining which extensions to return.",
          type: {
            type: "object",
            properties: {
              Category: {
                type: "string",
              },
              PublisherId: {
                type: "string",
              },
              TypeNamePrefix: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
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
            "If the previous paginated request didn't return all the remaining results, the response object's NextToken parameter value is set to a token.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListTypesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Types Result",
      description: "Result from ListTypes operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TypeSummaries: {
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
                DefaultVersionId: {
                  type: "string",
                },
                TypeArn: {
                  type: "string",
                },
                LastUpdated: {
                  type: "string",
                },
                Description: {
                  type: "string",
                },
                PublisherId: {
                  type: "string",
                },
                OriginalTypeName: {
                  type: "string",
                },
                PublicVersionNumber: {
                  type: "string",
                },
                LatestPublicVersion: {
                  type: "string",
                },
                PublisherIdentity: {
                  type: "string",
                },
                PublisherName: {
                  type: "string",
                },
                IsActivated: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
            description:
              "A list of TypeSummary structures that contain information about the specified extensions.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all the remaining results, NextToken is set to a token.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTypes;
