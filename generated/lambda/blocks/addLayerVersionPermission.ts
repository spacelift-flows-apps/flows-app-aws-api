import { AppBlock, events } from "@slflows/sdk/v1";
import {
  LambdaClient,
  AddLayerVersionPermissionCommand,
} from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const addLayerVersionPermission: AppBlock = {
  name: "Add Layer Version Permission",
  description: `Adds permissions to the resource-based policy of a version of an Lambda layer.`,
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
        LayerName: {
          name: "Layer Name",
          description: "The name or Amazon Resource Name (ARN) of the layer.",
          type: "string",
          required: true,
        },
        VersionNumber: {
          name: "Version Number",
          description: "The version number.",
          type: "number",
          required: true,
        },
        StatementId: {
          name: "Statement Id",
          description:
            "An identifier that distinguishes the policy from others on the same layer version.",
          type: "string",
          required: true,
        },
        Action: {
          name: "Action",
          description: "The API action that grants access to the layer.",
          type: "string",
          required: true,
        },
        Principal: {
          name: "Principal",
          description:
            "An account ID, or * to grant layer usage permission to all accounts in an organization, or all Amazon Web Services accounts (if organizationId is not specified).",
          type: "string",
          required: true,
        },
        OrganizationId: {
          name: "Organization Id",
          description:
            "With the principal set to *, grant permission to all accounts in the specified organization.",
          type: "string",
          required: false,
        },
        RevisionId: {
          name: "Revision Id",
          description:
            "Only update the policy if the revision ID matches the ID specified.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AddLayerVersionPermissionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Add Layer Version Permission Result",
      description: "Result from AddLayerVersionPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Statement: {
            type: "string",
            description: "The permission statement.",
          },
          RevisionId: {
            type: "string",
            description:
              "A unique identifier for the current revision of the policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default addLayerVersionPermission;
