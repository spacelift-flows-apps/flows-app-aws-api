import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getParameter: AppBlock = {
  name: "Get Parameter",
  description: `Get information about a single parameter by specifying the parameter name.`,
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
            "The name or Amazon Resource Name (ARN) of the parameter that you want to query.",
          type: "string",
          required: true,
        },
        WithDecryption: {
          name: "With Decryption",
          description: "Return decrypted values for secure string parameters.",
          type: "boolean",
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

        const command = new GetParameterCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Parameter Result",
      description: "Result from GetParameter operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Parameter: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Type: {
                type: "string",
              },
              Value: {
                type: "string",
              },
              Version: {
                type: "number",
              },
              Selector: {
                type: "string",
              },
              SourceResult: {
                type: "string",
              },
              LastModifiedDate: {
                type: "string",
              },
              ARN: {
                type: "string",
              },
              DataType: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about a parameter.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getParameter;
