import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  DescribeInstancePatchStatesForPatchGroupCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeInstancePatchStatesForPatchGroup: AppBlock = {
  name: "Describe Instance Patch States For Patch Group",
  description: `Retrieves the high-level patch state for the managed nodes in the specified patch group.`,
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
        PatchGroup: {
          name: "Patch Group",
          description:
            "The name of the patch group for which the patch state information should be retrieved.",
          type: "string",
          required: true,
        },
        Filters: {
          name: "Filters",
          description:
            "Each entry in the array is a structure containing: Key (string between 1 and 200 characters) Values ...",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Type: {
                  type: "string",
                },
              },
              required: ["Key", "Values", "Type"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "The token for the next set of items to return.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "The maximum number of patches to return (per page).",
          type: "number",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeInstancePatchStatesForPatchGroupCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Instance Patch States For Patch Group Result",
      description:
        "Result from DescribeInstancePatchStatesForPatchGroup operation",
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

export default describeInstancePatchStatesForPatchGroup;
