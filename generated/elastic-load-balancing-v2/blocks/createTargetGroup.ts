import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  CreateTargetGroupCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTargetGroup: AppBlock = {
  name: "Create Target Group",
  description: `Creates a target group.`,
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
        Name: {
          name: "Name",
          description: "The name of the target group.",
          type: "string",
          required: true,
        },
        Protocol: {
          name: "Protocol",
          description:
            "The protocol to use for routing traffic to the targets.",
          type: "string",
          required: false,
        },
        ProtocolVersion: {
          name: "Protocol Version",
          description: "[HTTP/HTTPS protocol] The protocol version.",
          type: "string",
          required: false,
        },
        Port: {
          name: "Port",
          description: "The port on which the targets receive traffic.",
          type: "number",
          required: false,
        },
        VpcId: {
          name: "Vpc Id",
          description: "The identifier of the virtual private cloud (VPC).",
          type: "string",
          required: false,
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
        HealthCheckEnabled: {
          name: "Health Check Enabled",
          description: "Indicates whether health checks are enabled.",
          type: "boolean",
          required: false,
        },
        HealthCheckPath: {
          name: "Health Check Path",
          description:
            "[HTTP/HTTPS health checks] The destination for health checks on the targets.",
          type: "string",
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
            "The amount of time, in seconds, during which no response from a target means a failed health check.",
          type: "number",
          required: false,
        },
        HealthyThresholdCount: {
          name: "Healthy Threshold Count",
          description:
            "The number of consecutive health check successes required before considering a target healthy.",
          type: "number",
          required: false,
        },
        UnhealthyThresholdCount: {
          name: "Unhealthy Threshold Count",
          description:
            "The number of consecutive health check failures required before considering a target unhealthy.",
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
        TargetType: {
          name: "Target Type",
          description:
            "The type of target that you must specify when registering targets with this target group.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the target group.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        IpAddressType: {
          name: "Ip Address Type",
          description: "The IP address type.",
          type: "string",
          required: false,
        },
        TargetControlPort: {
          name: "Target Control Port",
          description:
            "The port on which the target control agent and application load balancer exchange management traffic for the target optimizer feature.",
          type: "number",
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

        const command = new CreateTargetGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Target Group Result",
      description: "Result from CreateTargetGroup operation",
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
            description: "Information about the target group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createTargetGroup;
