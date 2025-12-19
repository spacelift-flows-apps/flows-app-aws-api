import { AppBlock, events } from "@slflows/sdk/v1";
import { KMSClient, ListKeysCommand } from "@aws-sdk/client-kms";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listKeys: AppBlock = {
  name: "List Keys",
  description: `Gets a list of all KMS keys in the caller's Amazon Web Services account and Region.`,
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
        Limit: {
          name: "Limit",
          description:
            "Use this parameter to specify the maximum number of items to return.",
          type: "number",
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "Use this parameter in a subsequent request after you receive a response with truncated results.",
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

        const client = new KMSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListKeysCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Keys Result",
      description: "Result from ListKeys operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Keys: {
            type: "array",
            items: {
              type: "object",
              properties: {
                KeyId: {
                  type: "string",
                },
                KeyArn: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "A list of KMS keys.",
          },
          NextMarker: {
            type: "string",
            description:
              "When Truncated is true, this element is present and contains the value to use for the Marker parameter in a subsequent request.",
          },
          Truncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more items in the list.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listKeys;
