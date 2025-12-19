import { AppBlock, events } from "@slflows/sdk/v1";
import {
  RedshiftClient,
  GetClusterCredentialsCommand,
} from "@aws-sdk/client-redshift";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getClusterCredentials: AppBlock = {
  name: "Get Cluster Credentials",
  description: `Returns a database user name and temporary password with temporary authorization to log on to an Amazon Redshift database.`,
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
        DbUser: {
          name: "Db User",
          description: "The name of a database user.",
          type: "string",
          required: true,
        },
        DbName: {
          name: "Db Name",
          description:
            "The name of a database that DbUser is authorized to log on to.",
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
        AutoCreate: {
          name: "Auto Create",
          description:
            "Create a database user with the name specified for the user named in DbUser if one does not exist.",
          type: "boolean",
          required: false,
        },
        DbGroups: {
          name: "Db Groups",
          description:
            "A list of the names of existing database groups that the user named in DbUser will join for the current session, in addition to any group memberships for an existing user.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        CustomDomainName: {
          name: "Custom Domain Name",
          description: "The custom domain name for the cluster credentials.",
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

        const client = new RedshiftClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetClusterCredentialsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Cluster Credentials Result",
      description: "Result from GetClusterCredentials operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DbUser: {
            type: "string",
            description:
              "A database user name that is authorized to log on to the database DbName using the password DbPassword.",
          },
          DbPassword: {
            type: "string",
            description:
              "A temporary password that authorizes the user name returned by DbUser to log on to the database DbName.",
          },
          Expiration: {
            type: "string",
            description:
              "The date and time the password in DbPassword expires.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getClusterCredentials;
