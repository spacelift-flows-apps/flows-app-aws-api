import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifySpotFleetRequestCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifySpotFleetRequest: AppBlock = {
  name: "Modify Spot Fleet Request",
  description: `Modifies the specified Spot Fleet request.`,
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
        LaunchTemplateConfigs: {
          name: "Launch Template Configs",
          description: "The launch template and overrides.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LaunchTemplateSpecification: {
                  type: "object",
                  properties: {
                    LaunchTemplateId: {
                      type: "string",
                    },
                    LaunchTemplateName: {
                      type: "string",
                    },
                    Version: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                Overrides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      InstanceType: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SpotPrice: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SubnetId: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AvailabilityZone: {
                        type: "object",
                        additionalProperties: true,
                      },
                      WeightedCapacity: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Priority: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceRequirements: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        OnDemandTargetCapacity: {
          name: "On Demand Target Capacity",
          description: "The number of On-Demand Instances in the fleet.",
          type: "number",
          required: false,
        },
        Context: {
          name: "Context",
          description: "Reserved.",
          type: "string",
          required: false,
        },
        SpotFleetRequestId: {
          name: "Spot Fleet Request Id",
          description: "The ID of the Spot Fleet request.",
          type: "string",
          required: true,
        },
        TargetCapacity: {
          name: "Target Capacity",
          description: "The size of the fleet.",
          type: "number",
          required: false,
        },
        ExcessCapacityTerminationPolicy: {
          name: "Excess Capacity Termination Policy",
          description:
            "Indicates whether running instances should be terminated if the target capacity of the Spot Fleet request is decreased below the current size of the Spot Fleet.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifySpotFleetRequestCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Spot Fleet Request Result",
      description: "Result from ModifySpotFleetRequest operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description: "If the request succeeds, the response returns true.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifySpotFleetRequest;
