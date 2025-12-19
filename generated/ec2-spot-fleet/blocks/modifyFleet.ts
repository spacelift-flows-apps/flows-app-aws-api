import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyFleetCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyFleet: AppBlock = {
  name: "Modify Fleet",
  description: `Modifies the specified EC2 Fleet.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        ExcessCapacityTerminationPolicy: {
          name: "Excess Capacity Termination Policy",
          description:
            "Indicates whether running instances should be terminated if the total target capacity of the EC2 Fleet is decreased below the current size of the EC2 Fleet.",
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
                      MaxPrice: {
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
                      Placement: {
                        type: "object",
                        additionalProperties: true,
                      },
                      BlockDeviceMappings: {
                        type: "object",
                        additionalProperties: true,
                      },
                      InstanceRequirements: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ImageId: {
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
        FleetId: {
          name: "Fleet Id",
          description: "The ID of the EC2 Fleet.",
          type: "string",
          required: true,
        },
        TargetCapacitySpecification: {
          name: "Target Capacity Specification",
          description: "The size of the EC2 Fleet.",
          type: {
            type: "object",
            properties: {
              TotalTargetCapacity: {
                type: "number",
              },
              OnDemandTargetCapacity: {
                type: "number",
              },
              SpotTargetCapacity: {
                type: "number",
              },
              DefaultTargetCapacityType: {
                type: "string",
              },
              TargetCapacityUnitType: {
                type: "string",
              },
            },
            required: ["TotalTargetCapacity"],
            additionalProperties: false,
          },
          required: false,
        },
        Context: {
          name: "Context",
          description: "Reserved.",
          type: "string",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyFleetCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Fleet Result",
      description: "Result from ModifyFleet operation",
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

export default modifyFleet;
