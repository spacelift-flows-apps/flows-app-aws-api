import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listResourceRecordSets: AppBlock = {
  name: "List Resource Record Sets",
  description: `Lists the resource record sets in a specified hosted zone.`,
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
            "The ID of the hosted zone that contains the resource record sets that you want to list.",
          type: "string",
          required: true,
        },
        StartRecordName: {
          name: "Start Record Name",
          description:
            "The first name in the lexicographic ordering of resource record sets that you want to list.",
          type: "string",
          required: false,
        },
        StartRecordType: {
          name: "Start Record Type",
          description:
            "The type of resource record set to begin the record listing from.",
          type: "string",
          required: false,
        },
        StartRecordIdentifier: {
          name: "Start Record Identifier",
          description:
            "Resource record sets that have a routing policy other than simple: If results were truncated for a given DNS name and type, specify the value of NextRecordIdentifier from the previous response to get the next resource record set that has the current DNS name and type.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "(Optional) The maximum number of resource records sets to include in the response body for this request.",
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

        const command = new ListResourceRecordSetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Resource Record Sets Result",
      description: "Result from ListResourceRecordSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourceRecordSets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
                SetIdentifier: {
                  type: "string",
                },
                Weight: {
                  type: "number",
                },
                Region: {
                  type: "string",
                },
                GeoLocation: {
                  type: "object",
                  properties: {
                    ContinentCode: {
                      type: "string",
                    },
                    CountryCode: {
                      type: "string",
                    },
                    SubdivisionCode: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Failover: {
                  type: "string",
                },
                MultiValueAnswer: {
                  type: "boolean",
                },
                TTL: {
                  type: "number",
                },
                ResourceRecords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Value"],
                    additionalProperties: false,
                  },
                },
                AliasTarget: {
                  type: "object",
                  properties: {
                    HostedZoneId: {
                      type: "string",
                    },
                    DNSName: {
                      type: "string",
                    },
                    EvaluateTargetHealth: {
                      type: "boolean",
                    },
                  },
                  required: ["HostedZoneId", "DNSName", "EvaluateTargetHealth"],
                  additionalProperties: false,
                },
                HealthCheckId: {
                  type: "string",
                },
                TrafficPolicyInstanceId: {
                  type: "string",
                },
                CidrRoutingConfig: {
                  type: "object",
                  properties: {
                    CollectionId: {
                      type: "string",
                    },
                    LocationName: {
                      type: "string",
                    },
                  },
                  required: ["CollectionId", "LocationName"],
                  additionalProperties: false,
                },
                GeoProximityLocation: {
                  type: "object",
                  properties: {
                    AWSRegion: {
                      type: "string",
                    },
                    LocalZoneGroup: {
                      type: "string",
                    },
                    Coordinates: {
                      type: "object",
                      properties: {
                        Latitude: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Longitude: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Latitude", "Longitude"],
                      additionalProperties: false,
                    },
                    Bias: {
                      type: "number",
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ["Name", "Type"],
              additionalProperties: false,
            },
            description: "Information about multiple resource record sets.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether more resource record sets remain to be listed.",
          },
          NextRecordName: {
            type: "string",
            description:
              "If the results were truncated, the name of the next record in the list.",
          },
          NextRecordType: {
            type: "string",
            description:
              "If the results were truncated, the type of the next record in the list.",
          },
          NextRecordIdentifier: {
            type: "string",
            description:
              "Resource record sets that have a routing policy other than simple: If results were truncated for a given DNS name and type, the value of SetIdentifier for the next resource record set that has the current DNS name and type.",
          },
          MaxItems: {
            type: "string",
            description: "The maximum number of records you requested.",
          },
        },
        required: ["ResourceRecordSets", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listResourceRecordSets;
