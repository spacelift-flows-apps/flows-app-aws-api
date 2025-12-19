import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListHostedZonesCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHostedZones: AppBlock = {
  name: "List Hosted Zones",
  description: `Retrieves a list of the public and private hosted zones that are associated with the current Amazon Web Services account.`,
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
        Marker: {
          name: "Marker",
          description:
            "If the value of IsTruncated in the previous response was true, you have more hosted zones.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "(Optional) The maximum number of hosted zones that you want Amazon Route 53 to return.",
          type: "string",
          required: false,
        },
        DelegationSetId: {
          name: "Delegation Set Id",
          description:
            "If you're using reusable delegation sets and you want to list all of the hosted zones that are associated with a reusable delegation set, specify the ID of that reusable delegation set.",
          type: "string",
          required: false,
        },
        HostedZoneType: {
          name: "Hosted Zone Type",
          description: "(Optional) Specifies if the hosted zone is private.",
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

        const command = new ListHostedZonesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Hosted Zones Result",
      description: "Result from ListHostedZones operation",
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
          Marker: {
            type: "string",
            description:
              "For the second and subsequent calls to ListHostedZones, Marker is the value that you specified for the marker parameter in the request that produced the current response.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag indicating whether there are more hosted zones to be listed.",
          },
          NextMarker: {
            type: "string",
            description:
              "If IsTruncated is true, the value of NextMarker identifies the first hosted zone in the next group of hosted zones.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the maxitems parameter in the call to ListHostedZones that produced the current response.",
          },
        },
        required: ["HostedZones", "Marker", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listHostedZones;
