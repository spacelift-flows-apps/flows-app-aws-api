import { AppBlock, events } from "@slflows/sdk/v1";
import {
  DynamoDBClient,
  PutResourcePolicyCommand,
} from "@aws-sdk/client-dynamodb";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putResourcePolicy: AppBlock = {
  name: "Put Resource Policy",
  description: `Attaches a resource-based policy document to the resource, which can be a table or stream.`,
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
        ResourceArn: {
          name: "Resource Arn",
          description:
            "The Amazon Resource Name (ARN) of the DynamoDB resource to which the policy will be attached.",
          type: "string",
          required: true,
        },
        Policy: {
          name: "Policy",
          description:
            "An Amazon Web Services resource-based policy document in JSON format.",
          type: "string",
          required: true,
        },
        ExpectedRevisionId: {
          name: "Expected Revision Id",
          description:
            "A string value that you can use to conditionally update your policy.",
          type: "string",
          required: false,
        },
        ConfirmRemoveSelfResourceAccess: {
          name: "Confirm Remove Self Resource Access",
          description:
            "Set this parameter to true to confirm that you want to remove your permissions to change the policy of this resource in the future.",
          type: "boolean",
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

        const client = new DynamoDBClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutResourcePolicyCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Resource Policy Result",
      description: "Result from PutResourcePolicy operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RevisionId: {
            type: "string",
            description:
              "A unique string that represents the revision ID of the policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default putResourcePolicy;
