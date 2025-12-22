import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyHostsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyHosts: AppBlock = {
  name: "Modify Hosts",
  description: `Modify the auto-placement setting of a Dedicated Host.`,
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
        HostRecovery: {
          name: "Host Recovery",
          description:
            "Indicates whether to enable or disable host recovery for the Dedicated Host.",
          type: "string",
          required: false,
        },
        InstanceType: {
          name: "Instance Type",
          description:
            "Specifies the instance type to be supported by the Dedicated Host.",
          type: "string",
          required: false,
        },
        InstanceFamily: {
          name: "Instance Family",
          description:
            "Specifies the instance family to be supported by the Dedicated Host.",
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
        HostIds: {
          name: "Host Ids",
          description: "The IDs of the Dedicated Hosts to modify.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        AutoPlacement: {
          name: "Auto Placement",
          description: "Specify whether to enable or disable auto-placement.",
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
        }

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyHostsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Hosts Result",
      description: "Result from ModifyHosts operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Successful: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The IDs of the Dedicated Hosts that were successfully modified.",
          },
          Unsuccessful: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Error: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                ResourceId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The IDs of the Dedicated Hosts that could not be modified.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyHosts;
