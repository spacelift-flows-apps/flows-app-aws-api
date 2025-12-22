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
                    },
                    ResourceRecordSet: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Type: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SetIdentifier: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Weight: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Region: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GeoLocation: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Failover: {
                          type: "object",
                          additionalProperties: true,
                        },
                        MultiValueAnswer: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TTL: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ResourceRecords: {
                          type: "object",
                          additionalProperties: true,
                        },
                        AliasTarget: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HealthCheckId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TrafficPolicyInstanceId: {
                          type: "object",
                          additionalProperties: true,
                        },
                        CidrRoutingConfig: {
                          type: "object",
                          additionalProperties: true,
                        },
                        GeoProximityLocation: {
                          type: "object",
                          additionalProperties: true,
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
