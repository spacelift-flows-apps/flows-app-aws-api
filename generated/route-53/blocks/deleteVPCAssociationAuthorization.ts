import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  DeleteVPCAssociationAuthorizationCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteVPCAssociationAuthorization: AppBlock = {
  name: "Delete VPC Association Authorization",
  description: `Removes authorization to submit an AssociateVPCWithHostedZone request to associate a specified VPC with a hosted zone that was created by a different account.`,
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
            "When removing authorization to associate a VPC that was created by one Amazon Web Services account with a hosted zone that was created with a different Amazon Web Services account, the ID of the hosted zone.",
          type: "string",
          required: true,
        },
        VPC: {
          name: "VPC",
          description:
            "When removing authorization to associate a VPC that was created by one Amazon Web Services account with a hosted zone that was created with a different Amazon Web Services account, a complex type that includes the ID and region of the VPC.",
          type: {
            type: "object",
            properties: {
              VPCRegion: {
                type: "string",
                enum: [
                  "us-east-1",
                  "us-east-2",
                  "us-west-1",
                  "us-west-2",
                  "eu-west-1",
                  "eu-west-2",
                  "eu-west-3",
                  "eu-central-1",
                  "eu-central-2",
                  "ap-east-1",
                  "me-south-1",
                  "us-gov-west-1",
                  "us-gov-east-1",
                  "us-iso-east-1",
                  "us-iso-west-1",
                  "us-isob-east-1",
                  "me-central-1",
                  "ap-southeast-1",
                  "ap-southeast-2",
                  "ap-southeast-3",
                  "ap-south-1",
                  "ap-south-2",
                  "ap-northeast-1",
                  "ap-northeast-2",
                  "ap-northeast-3",
                  "eu-north-1",
                  "sa-east-1",
                  "ca-central-1",
                  "cn-north-1",
                  "cn-northwest-1",
                  "af-south-1",
                  "eu-south-1",
                  "eu-south-2",
                  "ap-southeast-4",
                  "il-central-1",
                  "ca-west-1",
                  "ap-southeast-5",
                  "mx-central-1",
                  "us-isof-south-1",
                  "us-isof-east-1",
                  "ap-southeast-7",
                  "ap-east-2",
                  "eu-isoe-west-1",
                  "ap-southeast-6",
                  "us-isob-west-1",
                  "eusc-de-east-1",
                ],
              },
              VPCId: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: true,
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

        const command = new DeleteVPCAssociationAuthorizationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete VPC Association Authorization Result",
      description: "Result from DeleteVPCAssociationAuthorization operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default deleteVPCAssociationAuthorization;
