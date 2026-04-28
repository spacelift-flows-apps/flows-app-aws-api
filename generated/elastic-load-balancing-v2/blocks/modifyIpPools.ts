import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  ModifyIpPoolsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyIpPools: AppBlock = {
  name: "Modify Ip Pools",
  description: `[Application Load Balancers] Modify the IP pool associated to a load balancer.`,
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
        IpamPools: {
          name: "Ipam Pools",
          description: "The IPAM pools to be modified.",
          type: {
            type: "object",
            properties: {
              Ipv4IpamPoolId: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        RemoveIpamPools: {
          name: "Remove Ipam Pools",
          description: "Remove the IP pools in use by the load balancer.",
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ModifyIpPoolsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Ip Pools Result",
      description: "Result from ModifyIpPools operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          IpamPools: {
            type: "object",
            properties: {
              Ipv4IpamPoolId: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "The IPAM pool ID.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyIpPools;
