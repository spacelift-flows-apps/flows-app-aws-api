import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, AllocateHostsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const allocateHosts: AppBlock = {
  name: "Allocate Hosts",
  description: `Allocates a Dedicated Host to your account.`,
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
        InstanceFamily: {
          name: "Instance Family",
          description:
            "Specifies the instance family to be supported by the Dedicated Hosts.",
          type: "string",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description:
            "The tags to apply to the Dedicated Host during creation.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
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
        HostRecovery: {
          name: "Host Recovery",
          description:
            "Indicates whether to enable or disable host recovery for the Dedicated Host.",
          type: "string",
          required: false,
        },
        OutpostArn: {
          name: "Outpost Arn",
          description:
            "The Amazon Resource Name (ARN) of the Amazon Web Services Outpost on which to allocate the Dedicated Host.",
          type: "string",
          required: false,
        },
        HostMaintenance: {
          name: "Host Maintenance",
          description:
            "Indicates whether to enable or disable host maintenance for the Dedicated Host.",
          type: "string",
          required: false,
        },
        AssetIds: {
          name: "Asset Ids",
          description:
            "The IDs of the Outpost hardware assets on which to allocate the Dedicated Hosts.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AvailabilityZoneId: {
          name: "Availability Zone Id",
          description: "The ID of the Availability Zone.",
          type: "string",
          required: false,
        },
        AutoPlacement: {
          name: "Auto Placement",
          description:
            "Indicates whether the host accepts any untargeted instance launches that match its instance type configuration, or if it only accepts Host tenancy instance launches that specify its unique host ID.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.",
          type: "string",
          required: false,
        },
        InstanceType: {
          name: "Instance Type",
          description:
            "Specifies the instance type to be supported by the Dedicated Hosts.",
          type: "string",
          required: false,
        },
        Quantity: {
          name: "Quantity",
          description:
            "The number of Dedicated Hosts to allocate to your account with these parameters.",
          type: "number",
          required: false,
        },
        AvailabilityZone: {
          name: "Availability Zone",
          description:
            "The Availability Zone in which to allocate the Dedicated Host.",
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

        const command = new AllocateHostsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Allocate Hosts Result",
      description: "Result from AllocateHosts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          HostIds: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The ID of the allocated Dedicated Host.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default allocateHosts;
