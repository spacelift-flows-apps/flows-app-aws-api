import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeResourceScanCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeResourceScan: AppBlock = {
  name: "Describe Resource Scan",
  description: `Describes details of a resource scan.`,
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
        ResourceScanId: {
          name: "Resource Scan Id",
          description: "The Amazon Resource Name (ARN) of the resource scan.",
          type: "string",
          required: true,
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeResourceScanCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Resource Scan Result",
      description: "Result from DescribeResourceScan operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourceScanId: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the resource scan.",
          },
          Status: {
            type: "string",
            description: "Status of the resource scan.",
          },
          StatusReason: {
            type: "string",
            description:
              "The reason for the resource scan status, providing more information if a failure happened.",
          },
          StartTime: {
            type: "string",
            description: "The time that the resource scan was started.",
          },
          EndTime: {
            type: "string",
            description: "The time that the resource scan was finished.",
          },
          PercentageCompleted: {
            type: "number",
            description:
              "The percentage of the resource scan that has been completed.",
          },
          ResourceTypes: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The list of resource types for the specified scan.",
          },
          ResourcesScanned: {
            type: "number",
            description: "The number of resources that were listed.",
          },
          ResourcesRead: {
            type: "number",
            description: "The number of resources that were read.",
          },
          ScanFilters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Types: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              additionalProperties: false,
            },
            description: "The scan filters that were used.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeResourceScan;
