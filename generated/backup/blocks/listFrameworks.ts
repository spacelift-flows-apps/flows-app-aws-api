import { AppBlock, events } from "@slflows/sdk/v1";
import { BackupClient, ListFrameworksCommand } from "@aws-sdk/client-backup";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listFrameworks: AppBlock = {
  name: "List Frameworks",
  description: `Returns a list of all frameworks for an Amazon Web Services account and Amazon Web Services Region.`,
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
        MaxResults: {
          name: "Max Results",
          description: "The number of desired results from 1 to 1000.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "An identifier that was returned from the previous call to this operation, which can be used to return the next set of items in the list.",
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

        const client = new BackupClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListFrameworksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Frameworks Result",
      description: "Result from ListFrameworks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Frameworks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                FrameworkName: {
                  type: "string",
                },
                FrameworkArn: {
                  type: "string",
                },
                FrameworkDescription: {
                  type: "string",
                },
                NumberOfControls: {
                  type: "number",
                },
                CreationTime: {
                  type: "string",
                },
                DeploymentStatus: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The frameworks with details for each framework, including the framework name, Amazon Resource Name (ARN), description, number of controls, creation time, and deployment status.",
          },
          NextToken: {
            type: "string",
            description:
              "An identifier that was returned from the previous call to this operation, which can be used to return the next set of items in the list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listFrameworks;
