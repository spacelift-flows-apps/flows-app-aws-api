import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  ModifyCapacityReservationCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyCapacityReservation: AppBlock = {
  name: "Modify Capacity Reservation",
  description: `Modifies the capacity reservation of the specified load balancer.`,
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
          required: true,
        },
        MinimumLoadBalancerCapacity: {
          name: "Minimum Load Balancer Capacity",
          description: "The minimum load balancer capacity reserved.",
          type: {
            type: "object",
            properties: {
              CapacityUnits: {
                type: "number",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        ResetCapacityReservation: {
          name: "Reset Capacity Reservation",
          description: "Resets the capacity reservation.",
          type: "boolean",
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyCapacityReservationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Capacity Reservation Result",
      description: "Result from ModifyCapacityReservation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          LastModifiedTime: {
            type: "string",
            description: "The last time the capacity reservation was modified.",
          },
          DecreaseRequestsRemaining: {
            type: "number",
            description: "The amount of daily capacity decreases remaining.",
          },
          MinimumLoadBalancerCapacity: {
            type: "object",
            properties: {
              CapacityUnits: {
                type: "number",
              },
            },
            additionalProperties: false,
            description:
              "The requested minimum capacity reservation for the load balancer",
          },
          CapacityReservationState: {
            type: "array",
            items: {
              type: "object",
              properties: {
                State: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Reason: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                AvailabilityZone: {
                  type: "string",
                },
                EffectiveCapacityUnits: {
                  type: "number",
                },
              },
              additionalProperties: false,
            },
            description: "The state of the capacity reservation.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyCapacityReservation;
