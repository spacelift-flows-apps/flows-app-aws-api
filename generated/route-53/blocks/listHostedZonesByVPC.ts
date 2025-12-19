import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListHostedZonesByVPCCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHostedZonesByVPC: AppBlock = {
  name: "List Hosted Zones By VPC",
  description: `Lists all the private hosted zones that a specified VPC is associated with, regardless of which Amazon Web Services account or Amazon Web Services service owns the hosted zones.`,
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
        VPCId: {
          name: "VPC Id",
          description:
            "The ID of the Amazon VPC that you want to list hosted zones for.",
          type: "string",
          required: true,
        },
        VPCRegion: {
          name: "VPC Region",
          description:
            "For the Amazon VPC that you specified for VPCId, the Amazon Web Services Region that you created the VPC in.",
          type: "string",
          required: true,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "(Optional) The maximum number of hosted zones that you want Amazon Route 53 to return.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "If the previous response included a NextToken element, the specified VPC is associated with more hosted zones.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListHostedZonesByVPCCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Hosted Zones By VPC Result",
      description: "Result from ListHostedZonesByVPC operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HostedZoneSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                HostedZoneId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Owner: {
                  type: "object",
                  properties: {
                    OwningAccount: {
                      type: "string",
                    },
                    OwningService: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["HostedZoneId", "Name", "Owner"],
              additionalProperties: false,
            },
            description:
              "A list that contains one HostedZoneSummary element for each hosted zone that the specified Amazon VPC is associated with.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for MaxItems in the most recent ListHostedZonesByVPC request.",
          },
          NextToken: {
            type: "string",
            description:
              "The value that you will use for NextToken in the next ListHostedZonesByVPC request.",
          },
        },
        required: ["HostedZoneSummaries", "MaxItems"],
      },
    },
  },
};

export default listHostedZonesByVPC;
