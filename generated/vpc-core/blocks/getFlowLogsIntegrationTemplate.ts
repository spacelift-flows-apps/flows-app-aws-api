import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  GetFlowLogsIntegrationTemplateCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getFlowLogsIntegrationTemplate: AppBlock = {
  name: "Get Flow Logs Integration Template",
  description: `Generates a CloudFormation template that streamlines and automates the integration of VPC flow logs with Amazon Athena.`,
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
        FlowLogId: {
          name: "Flow Log Id",
          description: "The ID of the flow log.",
          type: "string",
          required: true,
        },
        ConfigDeliveryS3DestinationArn: {
          name: "Config Delivery S3Destination Arn",
          description:
            "To store the CloudFormation template in Amazon S3, specify the location in Amazon S3.",
          type: "string",
          required: true,
        },
        IntegrateServices: {
          name: "Integrate Services",
          description: "Information about the service integration.",
          type: {
            type: "object",
            properties: {
              AthenaIntegrations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    IntegrationResultS3DestinationArn: {
                      type: "string",
                    },
                    PartitionLoadFrequency: {
                      type: "string",
                    },
                    PartitionStartDate: {
                      type: "string",
                    },
                    PartitionEndDate: {
                      type: "string",
                    },
                  },
                  required: [
                    "IntegrationResultS3DestinationArn",
                    "PartitionLoadFrequency",
                  ],
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
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

        const command = new GetFlowLogsIntegrationTemplateCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Flow Logs Integration Template Result",
      description: "Result from GetFlowLogsIntegrationTemplate operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Result: {
            type: "string",
            description: "The generated CloudFormation template.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getFlowLogsIntegrationTemplate;
