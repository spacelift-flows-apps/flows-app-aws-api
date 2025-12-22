import { AppBlock, events } from "@slflows/sdk/v1";
import {
  IAMClient,
  GenerateOrganizationsAccessReportCommand,
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const generateOrganizationsAccessReport: AppBlock = {
  name: "Generate Organizations Access Report",
  description: `Generates a report for service last accessed data for Organizations.`,
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
        EntityPath: {
          name: "Entity Path",
          description:
            "The path of the Organizations entity (root, OU, or account).",
          type: "string",
          required: true,
        },
        OrganizationsPolicyId: {
          name: "Organizations Policy Id",
          description:
            "The identifier of the Organizations service control policy (SCP).",
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

        const command = new GenerateOrganizationsAccessReportCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Generate Organizations Access Report Result",
      description: "Result from GenerateOrganizationsAccessReport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          JobId: {
            type: "string",
            description:
              "The job identifier that you can use in the GetOrganizationsAccessReport operation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default generateOrganizationsAccessReport;
