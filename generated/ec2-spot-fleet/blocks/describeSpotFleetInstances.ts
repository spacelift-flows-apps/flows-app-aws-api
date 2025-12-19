import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  DescribeSpotFleetInstancesCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeSpotFleetInstances: AppBlock = {
  name: "Describe Spot Fleet Instances",
  description: `Describes the running instances for the specified Spot Fleet.`,
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
        SpotFleetRequestId: {
          name: "Spot Fleet Request Id",
          description: "The ID of the Spot Fleet request.",
          type: "string",
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description:
            "The token to include in another request to get the next page of items.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of items to return for this request.",
          type: "number",
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

        const command = new DescribeSpotFleetInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Spot Fleet Instances Result",
      description: "Result from DescribeSpotFleetInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ActiveInstances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceId: {
                  type: "string",
                },
                InstanceType: {
                  type: "string",
                },
                SpotInstanceRequestId: {
                  type: "string",
                },
                InstanceHealth: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "The running instances.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to include in another request to get the next page of items.",
          },
          SpotFleetRequestId: {
            type: "string",
            description: "The ID of the Spot Fleet request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeSpotFleetInstances;
