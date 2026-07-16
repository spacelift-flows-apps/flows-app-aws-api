import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const changeResourceRecordSets: AppBlock = {
  name: "Change Resource Record Sets",
  description: `Creates, changes, or deletes a resource record set, which contains authoritative DNS information for a specified domain name or subdomain name.`,
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
            "The ID of the hosted zone that contains the resource record sets that you want to change.",
          type: "string",
          required: true,
        },
        ChangeBatch: {
          name: "Change Batch",
          description:
            "A complex type that contains an optional comment and the Changes element.",
          type: {
            type: "object",
            properties: {
              Comment: {
                type: "string",
              },
              Changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Action: {
                      type: "string",
                      enum: ["CREATE", "DELETE", "UPSERT"],
                    },
                    ResourceRecordSet: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "string",
                        },
                        Type: {
                          type: "string",
                          enum: [
                            "SOA",
                            "A",
                            "TXT",
                            "NS",
                            "CNAME",
                            "MX",
                            "NAPTR",
                            "PTR",
                            "SRV",
                            "SPF",
                            "AAAA",
                            "CAA",
                            "DS",
                            "TLSA",
                            "SSHFP",
                            "SVCB",
                            "HTTPS",
                          ],
                        },
                        SetIdentifier: {
                          type: "string",
                        },
                        Weight: {
                          type: "number",
                        },
                        Region: {
                          type: "string",
                          enum: [
                            "us-east-1",
                            "us-east-2",
                            "us-west-1",
                            "us-west-2",
                            "ca-central-1",
                            "eu-west-1",
                            "eu-west-2",
                            "eu-west-3",
                            "eu-central-1",
                            "eu-central-2",
                            "ap-southeast-1",
                            "ap-southeast-2",
                            "ap-southeast-3",
                            "ap-northeast-1",
                            "ap-northeast-2",
                            "ap-northeast-3",
                            "eu-north-1",
                            "sa-east-1",
                            "cn-north-1",
                            "cn-northwest-1",
                            "ap-east-1",
                            "me-south-1",
                            "me-central-1",
                            "ap-south-1",
                            "ap-south-2",
                            "af-south-1",
                            "eu-south-1",
                            "eu-south-2",
                            "ap-southeast-4",
                            "il-central-1",
                            "ca-west-1",
                            "ap-southeast-5",
                            "mx-central-1",
                            "ap-southeast-7",
                            "us-gov-east-1",
                            "us-gov-west-1",
                            "ap-east-2",
                            "ap-southeast-6",
                            "eusc-de-east-1",
                          ],
                        },
                        GeoLocation: {
                          type: "object",
                          properties: {
                            ContinentCode: {},
                            CountryCode: {},
                            SubdivisionCode: {},
                          },
                          additionalProperties: false,
                        },
                        Failover: {
                          type: "string",
                          enum: ["PRIMARY", "SECONDARY"],
                        },
                        MultiValueAnswer: {
                          type: "boolean",
                        },
                        TTL: {
                          type: "number",
                        },
                        ResourceRecords: {
                          type: "array",
                          items: {},
                        },
                        AliasTarget: {
                          type: "object",
                          properties: {
                            HostedZoneId: {},
                            DNSName: {},
                            EvaluateTargetHealth: {},
                          },
                          required: [
                            "HostedZoneId",
                            "DNSName",
                            "EvaluateTargetHealth",
                          ],
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
                            CollectionId: {},
                            LocationName: {},
                          },
                          required: ["CollectionId", "LocationName"],
                          additionalProperties: false,
                        },
                        GeoProximityLocation: {
                          type: "object",
                          properties: {
                            AWSRegion: {},
                            LocalZoneGroup: {},
                            Coordinates: {},
                            Bias: {},
                          },
                          additionalProperties: false,
                        },
                      },
                      required: ["Name", "Type"],
                      additionalProperties: false,
                    },
                  },
                  required: ["Action", "ResourceRecordSet"],
                  additionalProperties: false,
                },
              },
            },
            required: ["Changes"],
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

        const command = new ChangeResourceRecordSetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Change Resource Record Sets Result",
      description: "Result from ChangeResourceRecordSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ChangeInfo: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Status: {
                type: "string",
                enum: ["PENDING", "INSYNC"],
              },
              SubmittedAt: {
                type: "string",
              },
              Comment: {
                type: "string",
              },
            },
            required: ["Id", "Status", "SubmittedAt"],
            additionalProperties: false,
            description:
              "A complex type that contains information about changes made to your hosted zone.",
          },
        },
        required: ["ChangeInfo"],
      },
    },
  },
};

export default changeResourceRecordSets;
