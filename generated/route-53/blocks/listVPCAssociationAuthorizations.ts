import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListVPCAssociationAuthorizationsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listVPCAssociationAuthorizations: AppBlock = {
  name: "List VPC Association Authorizations",
  description: `Gets a list of the VPCs that were created by other accounts and that can be associated with a specified hosted zone because you've submitted one or more CreateVPCAssociationAuthorization requests.`,
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
        HostedZoneId: {
          name: "Hosted Zone Id",
          description:
            "The ID of the hosted zone for which you want a list of VPCs that can be associated with the hosted zone.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "Optional: If a response includes a NextToken element, there are more VPCs that can be associated with the specified hosted zone.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "Optional: An integer that specifies the maximum number of VPCs that you want Amazon Route 53 to return.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListVPCAssociationAuthorizationsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List VPC Association Authorizations Result",
      description: "Result from ListVPCAssociationAuthorizations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HostedZoneId: {
            type: "string",
            description:
              "The ID of the hosted zone that you can associate the listed VPCs with.",
          },
          NextToken: {
            type: "string",
            description:
              "When the response includes a NextToken element, there are more VPCs that can be associated with the specified hosted zone.",
          },
          VPCs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                VPCRegion: {
                  type: "string",
                },
                VPCId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The list of VPCs that are authorized to be associated with the specified hosted zone.",
          },
        },
        required: ["HostedZoneId", "VPCs"],
      },
    },
  },
};

export default listVPCAssociationAuthorizations;
