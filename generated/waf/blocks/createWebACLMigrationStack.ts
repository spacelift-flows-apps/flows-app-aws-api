import { AppBlock, events } from "@slflows/sdk/v1";
import {
  WAFClient,
  CreateWebACLMigrationStackCommand,
} from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createWebACLMigrationStack: AppBlock = {
  name: "Create Web ACL Migration Stack",
  description: `Creates an AWS CloudFormation WAFV2 template for the specified web ACL in the specified Amazon S3 bucket.`,
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
        WebACLId: {
          name: "Web ACL Id",
          description:
            "The UUID of the WAF Classic web ACL that you want to migrate to WAF v2.",
          type: "string",
          required: true,
        },
        S3BucketName: {
          name: "S3Bucket Name",
          description:
            "The name of the Amazon S3 bucket to store the CloudFormation template in.",
          type: "string",
          required: true,
        },
        IgnoreUnsupportedType: {
          name: "Ignore Unsupported Type",
          description:
            "Indicates whether to exclude entities that can't be migrated or to stop the migration.",
          type: "boolean",
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

        const client = new WAFClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateWebACLMigrationStackCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Web ACL Migration Stack Result",
      description: "Result from CreateWebACLMigrationStack operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          S3ObjectUrl: {
            type: "string",
            description: "The URL of the template created in Amazon S3.",
          },
        },
        required: ["S3ObjectUrl"],
      },
    },
  },
};

export default createWebACLMigrationStack;
