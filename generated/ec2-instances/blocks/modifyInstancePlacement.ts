import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, ModifyInstancePlacementCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyInstancePlacement: AppBlock = {
  name: "Modify Instance Placement",
  description: `Modifies the placement attributes for a specified instance.`,
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
        GroupName: {
          name: "Group Name",
          description:
            "The name of the placement group in which to place the instance.",
          type: "string",
          required: false,
        },
        PartitionNumber: {
          name: "Partition Number",
          description:
            "The number of the partition in which to place the instance.",
          type: "number",
          required: false,
        },
        HostResourceGroupArn: {
          name: "Host Resource Group Arn",
          description:
            "The ARN of the host resource group in which to place the instance.",
          type: "string",
          required: false,
        },
        GroupId: {
          name: "Group Id",
          description: "The Group Id of a placement group.",
          type: "string",
          required: false,
        },
        InstanceId: {
          name: "Instance Id",
          description: "The ID of the instance that you are modifying.",
          type: "string",
          required: true,
        },
        Tenancy: {
          name: "Tenancy",
          description: "The tenancy for the instance.",
          type: "string",
          required: false,
        },
        Affinity: {
          name: "Affinity",
          description: "The affinity setting for the instance.",
          type: "string",
          required: false,
        },
        HostId: {
          name: "Host Id",
          description:
            "The ID of the Dedicated Host with which to associate the instance.",
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

        const command = new ModifyInstancePlacementCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Instance Placement Result",
      description: "Result from ModifyInstancePlacement operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description:
              "Is true if the request succeeds, and an error otherwise.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyInstancePlacement;
