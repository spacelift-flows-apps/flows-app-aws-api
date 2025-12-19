import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  AssociateOpsItemRelatedItemCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateOpsItemRelatedItem: AppBlock = {
  name: "Associate Ops Item Related Item",
  description: `Associates a related item to a Systems Manager OpsCenter OpsItem.`,
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
        OpsItemId: {
          name: "Ops Item Id",
          description:
            "The ID of the OpsItem to which you want to associate a resource as a related item.",
          type: "string",
          required: true,
        },
        AssociationType: {
          name: "Association Type",
          description:
            "The type of association that you want to create between an OpsItem and a resource.",
          type: "string",
          required: true,
        },
        ResourceType: {
          name: "Resource Type",
          description:
            "The type of resource that you want to associate with an OpsItem.",
          type: "string",
          required: true,
        },
        ResourceUri: {
          name: "Resource Uri",
          description:
            "The Amazon Resource Name (ARN) of the Amazon Web Services resource that you want to associate with the OpsItem.",
          type: "string",
          required: true,
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

        const command = new AssociateOpsItemRelatedItemCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Ops Item Related Item Result",
      description: "Result from AssociateOpsItemRelatedItem operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          AssociationId: {
            type: "string",
            description: "The association ID.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateOpsItemRelatedItem;
