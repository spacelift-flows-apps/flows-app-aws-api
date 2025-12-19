import { AppBlock, events } from "@slflows/sdk/v1";
import { ECSClient, ListTasksCommand } from "@aws-sdk/client-ecs";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTasks: AppBlock = {
  name: "List Tasks",
  description: `Returns a list of tasks.`,
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
        cluster: {
          name: "cluster",
          description:
            "The short name or full Amazon Resource Name (ARN) of the cluster to use when filtering the ListTasks results.",
          type: "string",
          required: false,
        },
        containerInstance: {
          name: "container Instance",
          description:
            "The container instance ID or full ARN of the container instance to use when filtering the ListTasks results.",
          type: "string",
          required: false,
        },
        family: {
          name: "family",
          description:
            "The name of the task definition family to use when filtering the ListTasks results.",
          type: "string",
          required: false,
        },
        nextToken: {
          name: "next Token",
          description:
            "The nextToken value returned from a ListTasks request indicating that more results are available to fulfill the request and further calls will be needed.",
          type: "string",
          required: false,
        },
        maxResults: {
          name: "max Results",
          description:
            "The maximum number of task results that ListTasks returned in paginated output.",
          type: "number",
          required: false,
        },
        startedBy: {
          name: "started By",
          description: "The startedBy value to filter the task results with.",
          type: "string",
          required: false,
        },
        serviceName: {
          name: "service Name",
          description:
            "The name of the service to use when filtering the ListTasks results.",
          type: "string",
          required: false,
        },
        desiredStatus: {
          name: "desired Status",
          description:
            "The task desired status to use when filtering the ListTasks results.",
          type: "string",
          required: false,
        },
        launchType: {
          name: "launch Type",
          description:
            "The launch type to use when filtering the ListTasks results.",
          type: "string",
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

        const command = new ListTasksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Tasks Result",
      description: "Result from ListTasks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          taskArns: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The list of task ARN entries for the ListTasks request.",
          },
          nextToken: {
            type: "string",
            description:
              "The nextToken value to include in a future ListTasks request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listTasks;
