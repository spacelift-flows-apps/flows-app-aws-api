import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  GetPatchBaselineForPatchGroupCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getPatchBaselineForPatchGroup: AppBlock = {
  name: "Get Patch Baseline For Patch Group",
  description: `Retrieves the patch baseline that should be used for the specified patch group.`,
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
            "The name of the patch group whose patch baseline should be retrieved.",
          type: "string",
          required: true,
        },
        OperatingSystem: {
          name: "Operating System",
          description:
            "Returns the operating system rule specified for patch groups using the patch baseline.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetPatchBaselineForPatchGroupCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Patch Baseline For Patch Group Result",
      description: "Result from GetPatchBaselineForPatchGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BaselineId: {
            type: "string",
            description:
              "The ID of the patch baseline that should be used for the patch group.",
          },
          PatchGroup: {
            type: "string",
            description: "The name of the patch group.",
          },
          OperatingSystem: {
            type: "string",
            description:
              "The operating system rule specified for patch groups using the patch baseline.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getPatchBaselineForPatchGroup;
