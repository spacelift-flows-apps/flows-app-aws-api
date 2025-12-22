import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  AssociateDistributionTenantWebACLCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const associateDistributionTenantWebACL: AppBlock = {
  name: "Associate Distribution Tenant Web ACL",
  description: `Associates the WAF web ACL with a distribution tenant.`,
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
        Id: {
          name: "Id",
          description: "The ID of the distribution tenant.",
          type: "string",
          required: true,
        },
        WebACLArn: {
          name: "Web ACL Arn",
          description:
            "The Amazon Resource Name (ARN) of the WAF web ACL to associate.",
          type: "string",
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description: "The current ETag of the distribution tenant.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AssociateDistributionTenantWebACLCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Associate Distribution Tenant Web ACL Result",
      description: "Result from AssociateDistributionTenantWebACL operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Id: {
            type: "string",
            description: "The ID of the distribution tenant.",
          },
          WebACLArn: {
            type: "string",
            description:
              "The ARN of the WAF web ACL that you associated with the distribution tenant.",
          },
          ETag: {
            type: "string",
            description: "The current version of the distribution tenant.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default associateDistributionTenantWebACL;
