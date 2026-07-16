import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  ModifyLakehouseConfigurationCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyLakehouseConfiguration: AppBlock = {
  name: "Modify Lakehouse Configuration",
  description: `Modifies the lakehouse configuration for a cluster.`,
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
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The unique identifier of the cluster whose lakehouse configuration you want to modify.",
          type: "string",
          required: true,
        },
        LakehouseRegistration: {
          name: "Lakehouse Registration",
          description:
            "Specifies whether to register or deregister the cluster with Amazon Redshift federated permissions.",
          type: "string",
          required: false,
        },
        CatalogName: {
          name: "Catalog Name",
          description:
            "The name of the Glue data catalog that will be associated with the cluster enabled with Amazon Redshift federated permissions.",
          type: "string",
          required: false,
        },
        LakehouseIdcRegistration: {
          name: "Lakehouse Idc Registration",
          description:
            "Modifies the Amazon Web Services IAM Identity Center trusted identity propagation on a cluster enabled with Amazon Redshift federated permissions.",
          type: "string",
          required: false,
        },
        LakehouseIdcApplicationArn: {
          name: "Lakehouse Idc Application Arn",
          description:
            "The Amazon Resource Name (ARN) of the IAM Identity Center application used for enabling Amazon Web Services IAM Identity Center trusted identity propagation on a cluster enabled with Amazon Redshift federated permissions.",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "A boolean value that, if true, validates the request without actually modifying the lakehouse configuration.",
          type: "boolean",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyLakehouseConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Lakehouse Configuration Result",
      description: "Result from ModifyLakehouseConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ClusterIdentifier: {
            type: "string",
            description:
              "The unique identifier of the cluster associated with this lakehouse configuration.",
          },
          LakehouseIdcApplicationArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the IAM Identity Center application used for enabling Amazon Web Services IAM Identity Center trusted identity propagation on a cluster enabled with Amazon Redshift federated permissions.",
          },
          LakehouseRegistrationStatus: {
            type: "string",
            description: "The current status of the lakehouse registration.",
          },
          CatalogArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) of the Glue data catalog associated with the lakehouse configuration.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyLakehouseConfiguration;
