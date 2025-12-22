import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  GetClusterCredentialsWithIAMCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getClusterCredentialsWithIAM: AppBlock = {
  name: "Get Cluster Credentials With IAM",
  description: `Returns a database user name and temporary password with temporary authorization to log in to an Amazon Redshift database.`,
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
        DbName: {
          name: "Db Name",
          description:
            "The name of the database for which you are requesting credentials.",
          type: "string",
          required: false,
        },
        ClusterIdentifier: {
          name: "Cluster Identifier",
          description:
            "The unique identifier of the cluster that contains the database for which you are requesting credentials.",
          type: "string",
          required: false,
        },
        DurationSeconds: {
          name: "Duration Seconds",
          description:
            "The number of seconds until the returned temporary password expires.",
          type: "number",
          required: false,
        },
        CustomDomainName: {
          name: "Custom Domain Name",
          description:
            "The custom domain name for the IAM message cluster credentials.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetClusterCredentialsWithIAMCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Cluster Credentials With IAM Result",
      description: "Result from GetClusterCredentialsWithIAM operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DbUser: {
            type: "string",
            description:
              "A database user name that you provide when you connect to a database.",
          },
          DbPassword: {
            type: "string",
            description:
              "A temporary password that you provide when you connect to a database.",
          },
          Expiration: {
            type: "string",
            description: "The time (UTC) when the temporary password expires.",
          },
          NextRefreshTime: {
            type: "string",
            description: "Reserved for future use.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getClusterCredentialsWithIAM;
