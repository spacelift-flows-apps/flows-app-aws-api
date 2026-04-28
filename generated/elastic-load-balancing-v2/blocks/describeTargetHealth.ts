import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTargetHealth: AppBlock = {
  name: "Describe Target Health",
  description: `Describes the health of the specified targets or all of your targets.`,
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
        Targets: {
          name: "Targets",
          description: "The targets.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                AvailabilityZone: {
                  type: "string",
                },
                QuicServerId: {
                  type: "string",
                },
              },
              required: ["Id"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Include: {
          name: "Include",
          description: "Used to include anomaly detection information.",
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

        const command = new DescribeTargetHealthCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Target Health Result",
      description: "Result from DescribeTargetHealth operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TargetHealthDescriptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Target: {
                  type: "object",
                  properties: {
                    Id: {
                      type: "string",
                    },
                    Port: {
                      type: "number",
                    },
                    AvailabilityZone: {
                      type: "string",
                    },
                    QuicServerId: {
                      type: "string",
                    },
                  },
                  required: ["Id"],
                  additionalProperties: false,
                },
                HealthCheckPort: {
                  type: "string",
                },
                TargetHealth: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    Reason: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                AnomalyDetection: {
                  type: "object",
                  properties: {
                    Result: {
                      type: "string",
                    },
                    MitigationInEffect: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                AdministrativeOverride: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    Reason: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the health of the targets.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTargetHealth;
