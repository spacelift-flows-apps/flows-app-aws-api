import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  UpdateDomainAssociationCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateDomainAssociation: AppBlock = {
  name: "Update Domain Association",
  description: `We recommend that you use the UpdateDomainAssociation API operation to move a domain association, as it supports both standard distributions and distribution tenants.`,
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
        Domain: {
          name: "Domain",
          description: "The domain to update.",
          type: "string",
          required: true,
        },
        TargetResource: {
          name: "Target Resource",
          description:
            "The target standard distribution or distribution tenant resource for the domain.",
          type: {
            type: "object",
            properties: {
              DistributionId: {
                type: "string",
              },
              DistributionTenantId: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
        },
        IfMatch: {
          name: "If Match",
          description:
            "The value of the ETag identifier for the standard distribution or distribution tenant that will be associated with the domain.",
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

        const command = new UpdateDomainAssociationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Domain Association Result",
      description: "Result from UpdateDomainAssociation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Domain: {
            type: "string",
            description: "The domain that you're moving.",
          },
          ResourceId: {
            type: "string",
            description: "The intended destination for the domain.",
          },
          ETag: {
            type: "string",
            description:
              "The current version of the target standard distribution or distribution tenant that was associated with the domain.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updateDomainAssociation;
