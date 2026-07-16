import { AppBlock, events } from "@slflows/sdk/v1";
import { IAMClient, GetHumanReadableSummaryCommand } from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getHumanReadableSummary: AppBlock = {
  name: "Get Human Readable Summary",
  description: `Retrieves a human readable summary for a given entity.`,
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
        EntityArn: {
          name: "Entity Arn",
          description: "Arn of the entity to be summarized.",
          type: "string",
          required: true,
        },
        Locale: {
          name: "Locale",
          description:
            "A string representing the locale to use for the summary generation.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetHumanReadableSummaryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Human Readable Summary Result",
      description: "Result from GetHumanReadableSummary operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SummaryContent: {
            type: "string",
            description: "Summary content in the specified locale.",
          },
          Locale: {
            type: "string",
            description: "The locale that this response was generated for.",
          },
          SummaryState: {
            type: "string",
            description: "State of summary generation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getHumanReadableSummary;
