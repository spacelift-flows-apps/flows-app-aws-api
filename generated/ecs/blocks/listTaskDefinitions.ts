import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ListTaskDefinitionsCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTaskDefinitions: AppBlock = {
  name: "List Task Definitions",
  description: `Returns a list of task definitions that are registered to your account.`,
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
        familyPrefix: {
          name: "family Prefix",
          description:
            "The full family name to filter the ListTaskDefinitions results with.",
          type: "string",
          required: false,
        },
        status: {
          name: "status",
          description:
            "The task definition status to filter the ListTaskDefinitions results with.",
          type: "string",
          required: false,
        },
        sort: {
          name: "sort",
          description: "The order to sort the results in.",
          type: "string",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a ListTaskDefinitions request indicating that more results are available to fulfill the request and further calls will be needed.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of task definition results that ListTaskDefinitions returned in paginated output.",
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

        const client = new ECSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListTaskDefinitionsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Task Definitions Result",
      description: "Result from ListTaskDefinitions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskDefinitionArns: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The list of task definition Amazon Resource Name (ARN) entries for the ListTaskDefinitions request.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListTaskDefinitions request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTaskDefinitions;
