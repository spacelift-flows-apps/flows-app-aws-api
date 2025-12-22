import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, LabelParameterVersionCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const labelParameterVersion: AppBlock = {
  name: "Label Parameter Version",
  description: `A parameter label is a user-defined alias to help you manage different versions of a parameter.`,
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
            "The parameter name on which you want to attach one or more labels.",
          type: "string",
          required: true,
        },
        ParameterVersion: {
          name: "Parameter Version",
          description:
            "The specific version of the parameter on which you want to attach one or more labels.",
          type: "number",
          required: false,
        },
        Labels: {
          name: "Labels",
          description:
            "One or more labels to attach to the specified parameter version.",
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

        const command = new LabelParameterVersionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Label Parameter Version Result",
      description: "Result from LabelParameterVersion operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InvalidLabels: {
            type: "array",
            items: {
              type: "string",
            },
            description: "The label doesn't meet the requirements.",
          },
          ParameterVersion: {
            type: "number",
            description: "The version of the parameter that has been labeled.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default labelParameterVersion;
