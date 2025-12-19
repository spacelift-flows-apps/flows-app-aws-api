import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFormationClient,
  TestTypeCommand,
} from "@aws-sdk/client-cloudformation";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const testType: AppBlock = {
  name: "Test Type",
  description: `Tests a registered extension to make sure it meets all necessary requirements for being published in the CloudFormation registry.`,
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
        Arn: {
          name: "Arn",
          description: "The Amazon Resource Name (ARN) of the extension.",
          type: "string",
          required: false,
        },
        Type: {
          name: "Type",
          description: "The type of the extension to test.",
          type: "string",
          required: false,
        },
        TypeName: {
          name: "Type Name",
          description: "The name of the extension to test.",
          type: "string",
          required: false,
        },
        VersionId: {
          name: "Version Id",
          description: "The version of the extension to test.",
          type: "string",
          required: false,
        },
        LogDeliveryBucket: {
          name: "Log Delivery Bucket",
          description:
            "The S3 bucket to which CloudFormation delivers the contract test execution logs.",
          type: "string",
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

        const client = new CloudFormationClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new TestTypeCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Test Type Result",
      description: "Result from TestType operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TypeVersionArn: {
            type: "string",
            description: "The Amazon Resource Name (ARN) of the extension.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default testType;
