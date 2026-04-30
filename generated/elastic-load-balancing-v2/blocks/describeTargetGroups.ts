import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTargetGroups: AppBlock = {
  name: "Describe Target Groups",
  description: `Describes the specified target groups or all of your target groups.`,
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
        LoadBalancerArn: {
          name: "Load Balancer Arn",
          description: "The Amazon Resource Name (ARN) of the load balancer.",
          type: "string",
          required: false,
        },
        TargetGroupArns: {
          name: "Target Group Arns",
          description: "The Amazon Resource Names (ARN) of the target groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Names: {
          name: "Names",
          description: "The names of the target groups.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        PageSize: {
          name: "Page Size",
          description:
            "The maximum number of results to return with this call.",
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

        const command = new DescribeTargetGroupsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Target Groups Result",
      description: "Result from DescribeTargetGroups operation",
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
            description: "Information about the target groups.",
          },
          NextMarker: {
            type: "string",
            description:
              "If there are additional results, this is the marker for the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTargetGroups;
