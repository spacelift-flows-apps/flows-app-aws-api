import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  CancelQueryCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const cancelQuery: AppBlock = {
  name: "Cancel Query",
  description: `Cancels a query if the query is not in a terminated state, such as CANCELLED, FAILED, TIMED_OUT, or FINISHED.`,
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
        EventDataStore: {
          name: "Event Data Store",
          description:
            "The ARN (or the ID suffix of the ARN) of an event data store on which the specified query is running.",
          type: "string",
          required: false,
        },
        QueryId: {
          name: "Query Id",
          description: "The ID of the query that you want to cancel.",
          type: "string",
          required: true,
        },
        EventDataStoreOwnerAccountId: {
          name: "Event Data Store Owner Account Id",
          description: "The account ID of the event data store owner.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CancelQueryCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Cancel Query Result",
      description: "Result from CancelQuery operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          QueryId: {
            type: "string",
            description: "The ID of the canceled query.",
          },
          QueryStatus: {
            type: "string",
            description:
              "Shows the status of a query after a CancelQuery request.",
          },
          EventDataStoreOwnerAccountId: {
            type: "string",
            description: "The account ID of the event data store owner.",
          },
        },
        required: ["QueryId", "QueryStatus"],
      },
    },
  },
};

export default cancelQuery;
