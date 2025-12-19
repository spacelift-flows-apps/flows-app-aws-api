import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  ModifyVpcEndpointServiceConfigurationCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const modifyVpcEndpointServiceConfiguration: AppBlock = {
  name: "Modify Vpc Endpoint Service Configuration",
  description: `Modifies the attributes of the specified VPC endpoint service configuration.`,
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
        ServiceId: {
          name: "Service Id",
          description: "The ID of the service.",
          type: "string",
          required: true,
        },
        PrivateDnsName: {
          name: "Private Dns Name",
          description:
            "(Interface endpoint configuration) The private DNS name to assign to the endpoint service.",
          type: "string",
          required: false,
        },
        RemovePrivateDnsName: {
          name: "Remove Private Dns Name",
          description:
            "(Interface endpoint configuration) Removes the private DNS name of the endpoint service.",
          type: "boolean",
          required: false,
        },
        AcceptanceRequired: {
          name: "Acceptance Required",
          description:
            "Indicates whether requests to create an endpoint to the service must be accepted.",
          type: "boolean",
          required: false,
        },
        AddNetworkLoadBalancerArns: {
          name: "Add Network Load Balancer Arns",
          description:
            "The Amazon Resource Names (ARNs) of Network Load Balancers to add to the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveNetworkLoadBalancerArns: {
          name: "Remove Network Load Balancer Arns",
          description:
            "The Amazon Resource Names (ARNs) of Network Load Balancers to remove from the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AddGatewayLoadBalancerArns: {
          name: "Add Gateway Load Balancer Arns",
          description:
            "The Amazon Resource Names (ARNs) of Gateway Load Balancers to add to the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveGatewayLoadBalancerArns: {
          name: "Remove Gateway Load Balancer Arns",
          description:
            "The Amazon Resource Names (ARNs) of Gateway Load Balancers to remove from the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AddSupportedIpAddressTypes: {
          name: "Add Supported Ip Address Types",
          description:
            "The IP address types to add to the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveSupportedIpAddressTypes: {
          name: "Remove Supported Ip Address Types",
          description:
            "The IP address types to remove from the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        AddSupportedRegions: {
          name: "Add Supported Regions",
          description:
            "The supported Regions to add to the service configuration.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RemoveSupportedRegions: {
          name: "Remove Supported Regions",
          description:
            "The supported Regions to remove from the service configuration.",
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

        const command = new ModifyVpcEndpointServiceConfigurationCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Modify Vpc Endpoint Service Configuration Result",
      description:
        "Result from ModifyVpcEndpointServiceConfiguration operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Return: {
            type: "boolean",
            description:
              "Returns true if the request succeeds; otherwise, it returns an error.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default modifyVpcEndpointServiceConfiguration;
