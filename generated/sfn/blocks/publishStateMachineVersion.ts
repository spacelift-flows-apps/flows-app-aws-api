import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SFNClient,
  PublishStateMachineVersionCommand,
} from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const publishStateMachineVersion: AppBlock = {
  name: "Publish State Machine Version",
  description: `Creates a version from the current revision of a state machine.`,
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
        stateMachineArn: {
          name: "state Machine Arn",
          description: "The Amazon Resource Name (ARN) of the state machine.",
          type: "string",
          required: true,
        },
        revisionId: {
          name: "revision Id",
          description:
            "Only publish the state machine version if the current state machine's revision ID matches the specified ID.",
          type: "string",
          required: false,
        },
        description: {
          name: "description",
          description: "An optional description of the state machine version.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PublishStateMachineVersionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Publish State Machine Version Result",
      description: "Result from PublishStateMachineVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          creationDate: {
            type: "string",
            description: "The date the version was created.",
          },
          stateMachineVersionArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) (ARN) that identifies the state machine version.",
          },
        },
        required: ["creationDate", "stateMachineVersionArn"],
      },
    },
  },
};

export default publishStateMachineVersion;
