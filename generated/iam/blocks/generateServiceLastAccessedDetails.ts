import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  GenerateServiceLastAccessedDetailsCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const generateServiceLastAccessedDetails: AppBlock = {
  name: "Generate Service Last Accessed Details",
  description: `Generates a report that includes details about when an IAM resource (user, group, role, or policy) was last used in an attempt to access Amazon Web Services services.`,
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
        Arn: {
          name: "Arn",
          description:
            "The ARN of the IAM resource (user, group, role, or managed policy) used to generate information about when the resource was last used in an attempt to access an Amazon Web Services service.",
          type: "string",
          required: true,
        },
        Granularity: {
          name: "Granularity",
          description: "The level of detail that you want to generate.",
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

        const client = new IAMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GenerateServiceLastAccessedDetailsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Generate Service Last Accessed Details Result",
      description: "Result from GenerateServiceLastAccessedDetails operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          JobId: {
            type: "string",
            description:
              "The JobId that you can use in the GetServiceLastAccessedDetails or GetServiceLastAccessedDetailsWithEntities operations.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default generateServiceLastAccessedDetails;
