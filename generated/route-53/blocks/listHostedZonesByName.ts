import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListHostedZonesByNameCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHostedZonesByName: AppBlock = {
  name: "List Hosted Zones By Name",
  description: `Retrieves a list of your hosted zones in lexicographic order.`,
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
        DNSName: {
          name: "DNS Name",
          description:
            "(Optional) For your first request to ListHostedZonesByName, include the dnsname parameter only if you want to specify the name of the first hosted zone in the response.",
          type: "string",
          required: false,
        },
        HostedZoneId: {
          name: "Hosted Zone Id",
          description:
            "(Optional) For your first request to ListHostedZonesByName, do not include the hostedzoneid parameter.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of hosted zones to be included in the response body for this request.",
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

        const command = new ListHostedZonesByNameCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Hosted Zones By Name Result",
      description: "Result from ListHostedZonesByName operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HostedZones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                CallerReference: {
                  type: "string",
                },
                Config: {
                  type: "object",
                  properties: {
                    Comment: {
                      type: "string",
                    },
                    PrivateZone: {
                      type: "boolean",
                    },
                  },
                  additionalProperties: false,
                },
                ResourceRecordSetCount: {
                  type: "number",
                },
                LinkedService: {
                  type: "object",
                  properties: {
                    ServicePrincipal: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Id", "Name", "CallerReference"],
              additionalProperties: false,
            },
            description:
              "A complex type that contains general information about the hosted zone.",
          },
          DNSName: {
            type: "string",
            description:
              "For the second and subsequent calls to ListHostedZonesByName, DNSName is the value that you specified for the dnsname parameter in the request that produced the current response.",
          },
          HostedZoneId: {
            type: "string",
            description:
              "The ID that Amazon Route 53 assigned to the hosted zone when you created it.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more hosted zones to be listed.",
          },
          NextDNSName: {
            type: "string",
            description:
              "If IsTruncated is true, the value of NextDNSName is the name of the first hosted zone in the next group of maxitems hosted zones.",
          },
          NextHostedZoneId: {
            type: "string",
            description:
              "If IsTruncated is true, the value of NextHostedZoneId identifies the first hosted zone in the next group of maxitems hosted zones.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the maxitems parameter in the call to ListHostedZonesByName that produced the current response.",
          },
        },
        required: ["HostedZones", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listHostedZonesByName;
