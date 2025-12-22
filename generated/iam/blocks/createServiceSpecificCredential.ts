import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  CreateServiceSpecificCredentialCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createServiceSpecificCredential: AppBlock = {
  name: "Create Service Specific Credential",
  description: `Generates a set of credentials consisting of a user name and password that can be used to access the service specified in the request.`,
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
        UserName: {
          name: "User Name",
          description:
            "The name of the IAM user that is to be associated with the credentials.",
          type: "string",
          required: true,
        },
        ServiceName: {
          name: "Service Name",
          description:
            "The name of the Amazon Web Services service that is to be associated with the credentials.",
          type: "string",
          required: true,
        },
        CredentialAgeDays: {
          name: "Credential Age Days",
          description:
            "The number of days until the service specific credential expires.",
          type: "number",
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

        const command = new CreateServiceSpecificCredentialCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Service Specific Credential Result",
      description: "Result from CreateServiceSpecificCredential operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ServiceSpecificCredential: {
            type: "object",
            properties: {
              CreateDate: {
                type: "string",
              },
              ExpirationDate: {
                type: "string",
              },
              ServiceName: {
                type: "string",
              },
              ServiceUserName: {
                type: "string",
              },
              ServicePassword: {
                type: "string",
              },
              ServiceCredentialAlias: {
                type: "string",
              },
              ServiceCredentialSecret: {
                type: "string",
              },
              ServiceSpecificCredentialId: {
                type: "string",
              },
              UserName: {
                type: "string",
              },
              Status: {
                type: "string",
              },
            },
            required: [
              "CreateDate",
              "ServiceName",
              "ServiceSpecificCredentialId",
              "UserName",
              "Status",
            ],
            additionalProperties: false,
            description:
              "A structure that contains information about the newly created service-specific credential.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createServiceSpecificCredential;
