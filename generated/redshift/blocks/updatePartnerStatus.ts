import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  UpdatePartnerStatusCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updatePartnerStatus: AppBlock = {
  name: "Update Partner Status",
  description: `Updates the status of a partner integration.`,
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
        AccountId: {
          name: "Account Id",
          description:
            "The Amazon Web Services account ID that owns the cluster.",
          type: "string",
          required: true,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The cluster identifier of the cluster whose partner integration status is being updated.",
          type: "string",
          required: true,
        },
        DatabaseName: {
          name: "Database Name",
          description:
            "The name of the database whose partner integration status is being updated.",
          type: "string",
          required: true,
        },
        PartnerName: {
          name: "Partner Name",
          description:
            "The name of the partner whose integration status is being updated.",
          type: "string",
          required: true,
        },
        Status: {
          name: "Status",
          description: "The value of the updated status.",
          type: "string",
          required: true,
        },
        StatusMessage: {
          name: "Status Message",
          description: "The status message provided by the partner.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdatePartnerStatusCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Partner Status Result",
      description: "Result from UpdatePartnerStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DatabaseName: {
            type: "string",
            description:
              "The name of the database that receives data from the partner.",
          },
          PartnerName: {
            type: "string",
            description:
              "The name of the partner that is authorized to send data.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updatePartnerStatus;
