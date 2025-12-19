import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, UnlabelParameterVersionCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const unlabelParameterVersion: AppBlock = {
  name: "Unlabel Parameter Version",
  description: `Remove a label or labels from a parameter.`,
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
        Name: {
          name: "Name",
          description:
            "The name of the parameter from which you want to delete one or more labels.",
          type: "string",
          required: true,
        },
        ParameterVersion: {
          name: "Parameter Version",
          description:
            "The specific version of the parameter which you want to delete one or more labels from.",
          type: "number",
          required: true,
        },
        Labels: {
          name: "Labels",
          description:
            "One or more labels to delete from the specified parameter version.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
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

        const command = new UnlabelParameterVersionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Unlabel Parameter Version Result",
      description: "Result from UnlabelParameterVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          RemovedLabels: {
            type: "array",
            items: {
              type: "string",
            },
            description: "A list of all labels deleted from the parameter.",
          },
          InvalidLabels: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The labels that aren't attached to the given parameter version.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default unlabelParameterVersion;
