import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackEventsCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackEvents: AppBlock = {
  name: "Describe Stack Events",
  description: `Returns all stack related events for a specified stack in reverse chronological order.`,
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
        StackName: {
          name: "Stack Name",
          description:
            "The name or the unique stack ID that's associated with the stack, which aren't always interchangeable: Running stacks: You can specify either the stack's name or its unique stack ID.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "A string that identifies the next page of events that you want to retrieve.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStackEventsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Events Result",
      description: "Result from DescribeStackEvents operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackEvents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                StackId: {
                  type: "string",
                },
                EventId: {
                  type: "string",
                },
                StackName: {
                  type: "string",
                },
                LogicalResourceId: {
                  type: "string",
                },
                PhysicalResourceId: {
                  type: "string",
                },
                ResourceType: {
                  type: "string",
                },
                Timestamp: {
                  type: "string",
                },
                ResourceStatus: {
                  type: "string",
                },
                ResourceStatusReason: {
                  type: "string",
                },
                ResourceProperties: {
                  type: "string",
                },
                ClientRequestToken: {
                  type: "string",
                },
                HookType: {
                  type: "string",
                },
                HookStatus: {
                  type: "string",
                },
                HookStatusReason: {
                  type: "string",
                },
                HookInvocationPoint: {
                  type: "string",
                },
                HookFailureMode: {
                  type: "string",
                },
                DetailedStatus: {
                  type: "string",
                },
              },
              required: ["StackId", "EventId", "StackName", "Timestamp"],
              additionalProperties: false,
            },
            description: "A list of StackEvents structures.",
          },
          NextToken: {
            type: "string",
            description:
              "If the output exceeds 1 MB in size, a string that identifies the next page of events.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeStackEvents;
