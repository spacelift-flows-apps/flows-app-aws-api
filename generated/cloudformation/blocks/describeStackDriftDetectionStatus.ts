import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  DescribeStackDriftDetectionStatusCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeStackDriftDetectionStatus: AppBlock = {
  name: "Describe Stack Drift Detection Status",
  description: `Returns information about a stack drift detection operation.`,
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
        StackDriftDetectionId: {
          name: "Stack Drift Detection Id",
          description:
            "The ID of the drift detection results of this operation.",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeStackDriftDetectionStatusCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Stack Drift Detection Status Result",
      description: "Result from DescribeStackDriftDetectionStatus operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          StackId: {
            type: "string",
            description: "The ID of the stack.",
          },
          StackDriftDetectionId: {
            type: "string",
            description:
              "The ID of the drift detection results of this operation.",
          },
          StackDriftStatus: {
            type: "string",
            description:
              "Status of the stack's actual configuration compared to its expected configuration.",
          },
          DetectionStatus: {
            type: "string",
            description: "The status of the stack drift detection operation.",
          },
          DetectionStatusReason: {
            type: "string",
            description:
              "The reason the stack drift detection operation has its current status.",
          },
          DriftedStackResourceCount: {
            type: "number",
            description: "Total number of stack resources that have drifted.",
          },
          Timestamp: {
            type: "string",
            description:
              "Time at which the stack drift detection operation was initiated.",
          },
        },
        required: [
          "StackId",
          "StackDriftDetectionId",
          "DetectionStatus",
          "Timestamp",
        ],
      },
    },
  },
};

export default describeStackDriftDetectionStatus;
