import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetCalendarStateCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCalendarState: AppBlock = {
  name: "Get Calendar State",
  description: `Gets the state of a Amazon Web Services Systems Manager change calendar at the current time or a specified time.`,
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
        CalendarNames: {
          name: "Calendar Names",
          description:
            "The names of Amazon Resource Names (ARNs) of the Systems Manager documents (SSM documents) that represent the calendar entries for which you want to get the state.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        AtTime: {
          name: "At Time",
          description:
            "(Optional) The specific time for which you want to get calendar state information, in ISO 8601 format.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetCalendarStateCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Calendar State Result",
      description: "Result from GetCalendarState operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          State: {
            type: "string",
            description: "The state of the calendar.",
          },
          AtTime: {
            type: "string",
            description:
              "The time, as an ISO 8601 string, that you specified in your command.",
          },
          NextTransitionTime: {
            type: "string",
            description:
              "The time, as an ISO 8601 string, that the calendar state will change.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getCalendarState;
