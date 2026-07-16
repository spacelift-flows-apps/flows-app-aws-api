import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListHealthChecksCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listHealthChecks: AppBlock = {
  name: "List Health Checks",
  description: `Retrieve a list of the health checks that are associated with the current Amazon Web Services account.`,
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
            "If the value of IsTruncated in the previous response was true, you have more health checks.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of health checks that you want ListHealthChecks to return in response to the current request.",
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

        const command = new ListHealthChecksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Health Checks Result",
      description: "Result from ListHealthChecks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HealthChecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                CallerReference: {
                  type: "string",
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
                HealthCheckConfig: {
                  type: "object",
                  properties: {
                    IPAddress: {
                      type: "string",
                    },
                    Port: {
                      type: "number",
                    },
                    Type: {
                      type: "string",
                      enum: [
                        "HTTP",
                        "HTTPS",
                        "HTTP_STR_MATCH",
                        "HTTPS_STR_MATCH",
                        "TCP",
                        "CALCULATED",
                        "CLOUDWATCH_METRIC",
                        "RECOVERY_CONTROL",
                      ],
                    },
                    ResourcePath: {
                      type: "string",
                    },
                    FullyQualifiedDomainName: {
                      type: "string",
                    },
                    SearchString: {
                      type: "string",
                    },
                    RequestInterval: {
                      type: "number",
                    },
                    FailureThreshold: {
                      type: "number",
                    },
                    MeasureLatency: {
                      type: "boolean",
                    },
                    Inverted: {
                      type: "boolean",
                    },
                    Disabled: {
                      type: "boolean",
                    },
                    HealthThreshold: {
                      type: "number",
                    },
                    ChildHealthChecks: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    EnableSNI: {
                      type: "boolean",
                    },
                    Regions: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [
                          "us-east-1",
                          "us-west-1",
                          "us-west-2",
                          "eu-west-1",
                          "ap-southeast-1",
                          "ap-southeast-2",
                          "ap-northeast-1",
                          "sa-east-1",
                        ],
                      },
                    },
                    AlarmIdentifier: {
                      type: "object",
                      properties: {
                        Region: {
                          type: "string",
                          enum: [
                            "us-east-1",
                            "us-east-2",
                            "us-west-1",
                            "us-west-2",
                            "ca-central-1",
                            "eu-central-1",
                            "eu-central-2",
                            "eu-west-1",
                            "eu-west-2",
                            "eu-west-3",
                            "ap-east-1",
                            "me-south-1",
                            "me-central-1",
                            "ap-south-1",
                            "ap-south-2",
                            "ap-southeast-1",
                            "ap-southeast-2",
                            "ap-southeast-3",
                            "ap-northeast-1",
                            "ap-northeast-2",
                            "ap-northeast-3",
                            "eu-north-1",
                            "sa-east-1",
                            "cn-northwest-1",
                            "cn-north-1",
                            "af-south-1",
                            "eu-south-1",
                            "eu-south-2",
                            "us-gov-west-1",
                            "us-gov-east-1",
                            "us-iso-east-1",
                            "us-iso-west-1",
                            "us-isob-east-1",
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
                        Name: {
                          type: "string",
                        },
                      },
                      required: ["Region", "Name"],
                      additionalProperties: false,
                    },
                    InsufficientDataHealthStatus: {
                      type: "string",
                      enum: ["Healthy", "Unhealthy", "LastKnownStatus"],
                    },
                    RoutingControlArn: {
                      type: "string",
                    },
                  },
                  required: ["Type"],
                  additionalProperties: false,
                },
                HealthCheckVersion: {
                  type: "number",
                },
                CloudWatchAlarmConfiguration: {
                  type: "object",
                  properties: {
                    EvaluationPeriods: {
                      type: "number",
                    },
                    Threshold: {
                      type: "number",
                    },
                    ComparisonOperator: {
                      type: "string",
                      enum: [
                        "GreaterThanOrEqualToThreshold",
                        "GreaterThanThreshold",
                        "LessThanThreshold",
                        "LessThanOrEqualToThreshold",
                      ],
                    },
                    Period: {
                      type: "number",
                    },
                    MetricName: {
                      type: "string",
                    },
                    Namespace: {
                      type: "string",
                    },
                    Statistic: {
                      type: "string",
                      enum: [
                        "Average",
                        "Sum",
                        "SampleCount",
                        "Maximum",
                        "Minimum",
                      ],
                    },
                    Dimensions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          Name: {},
                          Value: {},
                        },
                        required: ["Name", "Value"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "EvaluationPeriods",
                    "Threshold",
                    "ComparisonOperator",
                    "Period",
                    "MetricName",
                    "Namespace",
                    "Statistic",
                  ],
                  additionalProperties: false,
                },
              },
              required: [
                "Id",
                "CallerReference",
                "HealthCheckConfig",
                "HealthCheckVersion",
              ],
              additionalProperties: false,
            },
            description:
              "A complex type that contains one HealthCheck element for each health check that is associated with the current Amazon Web Services account.",
          },
          Marker: {
            type: "string",
            description:
              "For the second and subsequent calls to ListHealthChecks, Marker is the value that you specified for the marker parameter in the previous request.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more health checks to be listed.",
          },
          NextMarker: {
            type: "string",
            description:
              "If IsTruncated is true, the value of NextMarker identifies the first health check that Amazon Route 53 returns if you submit another ListHealthChecks request and specify the value of NextMarker in the marker parameter.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the maxitems parameter in the call to ListHealthChecks that produced the current response.",
          },
        },
        required: ["HealthChecks", "Marker", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listHealthChecks;
