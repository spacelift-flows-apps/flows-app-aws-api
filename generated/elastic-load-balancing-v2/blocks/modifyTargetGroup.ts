import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  ModifyTargetGroupCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyTargetGroup: AppBlock = {
  name: "Modify Target Group",
  description: `Modifies the health checks used when evaluating the health state of the targets in the specified target group.`,
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
        TargetGroupArn: {
          name: "Target Group Arn",
          description: "The Amazon Resource Name (ARN) of the target group.",
          type: "string",
          required: true,
        },
        HealthCheckProtocol: {
          name: "Health Check Protocol",
          description:
            "The protocol the load balancer uses when performing health checks on targets.",
          type: "string",
          required: false,
        },
        HealthCheckPort: {
          name: "Health Check Port",
          description:
            "The port the load balancer uses when performing health checks on targets.",
          type: "string",
          required: false,
        },
        HealthCheckPath: {
          name: "Health Check Path",
          description:
            "[HTTP/HTTPS health checks] The destination for health checks on the targets.",
          type: "string",
          required: false,
        },
        HealthCheckEnabled: {
          name: "Health Check Enabled",
          description: "Indicates whether health checks are enabled.",
          type: "boolean",
          required: false,
        },
        HealthCheckIntervalSeconds: {
          name: "Health Check Interval Seconds",
          description:
            "The approximate amount of time, in seconds, between health checks of an individual target.",
          type: "number",
          required: false,
        },
        HealthCheckTimeoutSeconds: {
          name: "Health Check Timeout Seconds",
          description:
            "[HTTP/HTTPS health checks] The amount of time, in seconds, during which no response means a failed health check.",
          type: "number",
          required: false,
        },
        HealthyThresholdCount: {
          name: "Healthy Threshold Count",
          description:
            "The number of consecutive health checks successes required before considering an unhealthy target healthy.",
          type: "number",
          required: false,
        },
        UnhealthyThresholdCount: {
          name: "Unhealthy Threshold Count",
          description:
            "The number of consecutive health check failures required before considering the target unhealthy.",
          type: "number",
          required: false,
        },
        Matcher: {
          name: "Matcher",
          description:
            "[HTTP/HTTPS health checks] The HTTP or gRPC codes to use when checking for a successful response from a target.",
          type: {
            type: "object",
            properties: {
              HttpCode: {
                type: "string",
              },
              GrpcCode: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
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

        const client = new ElasticLoadBalancingV2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyTargetGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Target Group Result",
      description: "Result from ModifyTargetGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TargetGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TargetGroupArn: {
                  type: "string",
                },
                TargetGroupName: {
                  type: "string",
                },
                Protocol: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                VpcId: {
                  type: "string",
                },
                HealthCheckProtocol: {
                  type: "string",
                },
                HealthCheckPort: {
                  type: "string",
                },
                HealthCheckEnabled: {
                  type: "boolean",
                },
                HealthCheckIntervalSeconds: {
                  type: "number",
                },
                HealthCheckTimeoutSeconds: {
                  type: "number",
                },
                HealthyThresholdCount: {
                  type: "number",
                },
                UnhealthyThresholdCount: {
                  type: "number",
                },
                HealthCheckPath: {
                  type: "string",
                },
                Matcher: {
                  type: "object",
                  properties: {
                    HttpCode: {
                      type: "string",
                    },
                    GrpcCode: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                LoadBalancerArns: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                TargetType: {
                  type: "string",
                },
                ProtocolVersion: {
                  type: "string",
                },
                IpAddressType: {
                  type: "string",
                },
                TargetControlPort: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "Information about the modified target group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyTargetGroup;
