import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ListAccountSettingsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listAccountSettings: AppBlock = {
  name: "List Account Settings",
  description: `Lists the account settings for a specified principal.`,
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
        name: {
          name: "name",
          description:
            "The name of the account setting you want to list the settings for.",
          type: "string",
          required: false,
        },
        value: {
          name: "value",
          description:
            "The value of the account settings to filter results with.",
          type: "string",
          required: false,
        },
        principalArn: {
          name: "principal Arn",
          description:
            "The ARN of the principal, which can be a user, role, or the root user.",
          type: "string",
          required: false,
        },
        effectiveSettings: {
          name: "effective Settings",
          description: "Determines whether to return the effective settings.",
          type: "boolean",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a ListAccountSettings request indicating that more results are available to fulfill the request and further calls will be needed.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of account setting results returned by ListAccountSettings in paginated output.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListAccountSettingsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Account Settings Result",
      description: "Result from ListAccountSettings operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          settings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                value: {
                  type: "string",
                },
                principalArn: {
                  type: "string",
                },
                type: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The account settings for the resource.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListAccountSettings request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listAccountSettings;
