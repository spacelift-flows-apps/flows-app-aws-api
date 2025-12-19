import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInstancePatchStatesCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstancePatchStates: AppBlock = {
  name: "Describe Instance Patch States",
  description: `Retrieves the high-level patch state of one or more managed nodes.`,
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
        InstanceIds: {
          name: "Instance Ids",
          description:
            "The ID of the managed node for which patch state information should be retrieved.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of managed nodes to return (per page).",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeInstancePatchStatesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Patch States Result",
      description: "Result from DescribeInstancePatchStates operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstancePatchStates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                InstanceId: {
                  type: "string",
                },
                PatchGroup: {
                  type: "string",
                },
                BaselineId: {
                  type: "string",
                },
                SnapshotId: {
                  type: "string",
                },
                InstallOverrideList: {
                  type: "string",
                },
                OwnerInformation: {
                  type: "string",
                },
                InstalledCount: {
                  type: "number",
                },
                InstalledOtherCount: {
                  type: "number",
                },
                InstalledPendingRebootCount: {
                  type: "number",
                },
                InstalledRejectedCount: {
                  type: "number",
                },
                MissingCount: {
                  type: "number",
                },
                FailedCount: {
                  type: "number",
                },
                UnreportedNotApplicableCount: {
                  type: "number",
                },
                NotApplicableCount: {
                  type: "number",
                },
                AvailableSecurityUpdateCount: {
                  type: "number",
                },
                OperationStartTime: {
                  type: "string",
                },
                OperationEndTime: {
                  type: "string",
                },
                Operation: {
                  type: "string",
                },
                LastNoRebootInstallOperationTime: {
                  type: "string",
                },
                RebootOption: {
                  type: "string",
                },
                CriticalNonCompliantCount: {
                  type: "number",
                },
                SecurityNonCompliantCount: {
                  type: "number",
                },
                OtherNonCompliantCount: {
                  type: "number",
                },
              },
              required: [
                "InstanceId",
                "PatchGroup",
                "BaselineId",
                "OperationStartTime",
                "OperationEndTime",
                "Operation",
              ],
              additionalProperties: false,
            },
            description:
              "The high-level patch state for the requested managed nodes.",
          },
          NextToken: {
            type: "string",
            description:
              "The token to use when requesting the next set of items.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeInstancePatchStates;
