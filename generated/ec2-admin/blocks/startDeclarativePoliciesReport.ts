import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EC2Client,
  StartDeclarativePoliciesReportCommand,
} from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const startDeclarativePoliciesReport: AppBlock = {
  name: "Start Declarative Policies Report",
  description: `Generates an account status report.`,
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
        S3Bucket: {
          name: "S3Bucket",
          description:
            "The name of the S3 bucket where the report will be saved.",
          type: "string",
          required: true,
        },
        S3Prefix: {
          name: "S3Prefix",
          description: "The prefix for your S3 object.",
          type: "string",
          required: false,
        },
        TargetId: {
          name: "Target Id",
          description: "The root ID, organizational unit ID, or account ID.",
          type: "string",
          required: true,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply.",
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

        const command = new StartDeclarativePoliciesReportCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Start Declarative Policies Report Result",
      description: "Result from StartDeclarativePoliciesReport operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ReportId: {
            type: "string",
            description: "The ID of the report.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default startDeclarativePoliciesReport;
