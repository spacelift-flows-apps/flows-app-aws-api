import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  UpdateHealthCheckCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updateHealthCheck: AppBlock = {
  name: "Update Health Check",
  description: `Updates an existing health check.`,
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
        HealthCheckId: {
          name: "Health Check Id",
          description:
            "The ID for the health check for which you want detailed information.",
          type: "string",
          required: true,
        },
        HealthCheckVersion: {
          name: "Health Check Version",
          description:
            "A sequential counter that Amazon Route 53 sets to 1 when you create a health check and increments by 1 each time you update settings for the health check.",
          type: "number",
          required: false,
        },
        IPAddress: {
          name: "IP Address",
          description:
            "The IPv4 or IPv6 IP address for the endpoint that you want Amazon Route 53 to perform health checks on.",
          type: "string",
          required: false,
        },
        Port: {
          name: "Port",
          description:
            "The port on the endpoint that you want Amazon Route 53 to perform health checks on.",
          type: "number",
          required: false,
        },
        ResourcePath: {
          name: "Resource Path",
          description:
            "The path that you want Amazon Route 53 to request when performing health checks.",
          type: "string",
          required: false,
        },
        FullyQualifiedDomainName: {
          name: "Fully Qualified Domain Name",
          description:
            "Amazon Route 53 behavior depends on whether you specify a value for IPAddress.",
          type: "string",
          required: false,
        },
        SearchString: {
          name: "Search String",
          description:
            "If the value of Type is HTTP_STR_MATCH or HTTPS_STR_MATCH, the string that you want Amazon Route 53 to search for in the response body from the specified resource.",
          type: "string",
          required: false,
        },
        FailureThreshold: {
          name: "Failure Threshold",
          description:
            "The number of consecutive health checks that an endpoint must pass or fail for Amazon Route 53 to change the current status of the endpoint from unhealthy to healthy or vice versa.",
          type: "number",
          required: false,
        },
        Inverted: {
          name: "Inverted",
          description:
            "Specify whether you want Amazon Route 53 to invert the status of a health check, for example, to consider a health check unhealthy when it otherwise would be considered healthy.",
          type: "boolean",
          required: false,
        },
        Disabled: {
          name: "Disabled",
          description: "Stops Route 53 from performing health checks.",
          type: "boolean",
          required: false,
        },
        HealthThreshold: {
          name: "Health Threshold",
          description:
            "The number of child health checks that are associated with a CALCULATED health that Amazon Route 53 must consider healthy for the CALCULATED health check to be considered healthy.",
          type: "number",
          required: false,
        },
        ChildHealthChecks: {
          name: "Child Health Checks",
          description:
            "A complex type that contains one ChildHealthCheck element for each health check that you want to associate with a CALCULATED health check.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        EnableSNI: {
          name: "Enable SNI",
          description:
            "Specify whether you want Amazon Route 53 to send the value of FullyQualifiedDomainName to the endpoint in the client_hello message during TLS negotiation.",
          type: "boolean",
          required: false,
        },
        Regions: {
          name: "Regions",
          description:
            "A complex type that contains one Region element for each region that you want Amazon Route 53 health checkers to check the specified endpoint from.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AlarmIdentifier: {
          name: "Alarm Identifier",
          description:
            "A complex type that identifies the CloudWatch alarm that you want Amazon Route 53 health checkers to use to determine whether the specified health check is healthy.",
          type: {
            type: "object",
            properties: {
              Region: {
                type: "string",
              },
              Name: {
                type: "string",
              },
            },
            required: ["Region", "Name"],
            additionalProperties: false,
          },
          required: false,
        },
        InsufficientDataHealthStatus: {
          name: "Insufficient Data Health Status",
          description:
            "When CloudWatch has insufficient data about the metric to determine the alarm state, the status that you want Amazon Route 53 to assign to the health check: Healthy: Route 53 considers the health check to be healthy.",
          type: "string",
          required: false,
        },
        ResetElements: {
          name: "Reset Elements",
          description:
            "A complex type that contains one ResettableElementName element for each element that you want to reset to the default value.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
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

        const command = new UpdateHealthCheckCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Health Check Result",
      description: "Result from UpdateHealthCheck operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HealthCheck: {
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
                    },
                  },
                  AlarmIdentifier: {
                    type: "object",
                    properties: {
                      Region: {
                        type: "string",
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
                  },
                  Dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Name: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Value: {
                          type: "object",
                          additionalProperties: true,
                        },
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
            description:
              "A complex type that contains the response to an UpdateHealthCheck request.",
          },
        },
        required: ["HealthCheck"],
      },
    },
  },
};

export default updateHealthCheck;
