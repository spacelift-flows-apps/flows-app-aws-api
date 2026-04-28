import { AppBlock, events } from "@slflows/sdk/v1";
import { SFNClient, DescribeActivityCommand } from "@aws-sdk/client-sfn";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeActivity: AppBlock = {
  name: "Describe Activity",
  description: `Describes an activity.`,
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
        activityArn: {
          name: "activity Arn",
          description:
            "The Amazon Resource Name (ARN) of the activity to describe.",
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

        const client = new SFNClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeActivityCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Activity Result",
      description: "Result from DescribeActivity operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          activityArn: {
            type: "string",
            description:
              "The Amazon Resource Name (ARN) that identifies the activity.",
          },
          name: {
            type: "string",
            description: "The name of the activity.",
          },
          creationDate: {
            type: "string",
            description: "The date the activity is created.",
          },
          encryptionConfiguration: {
            type: "object",
            properties: {
              kmsKeyId: {
                type: "string",
              },
              kmsDataKeyReusePeriodSeconds: {
                type: "number",
              },
              type: {
                type: "string",
              },
            },
            required: ["type"],
            additionalProperties: false,
            description: "Settings for configured server-side encryption.",
          },
        },
        required: ["activityArn", "name", "creationDate"],
      },
    },
  },
};

export default describeActivity;
