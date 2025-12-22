import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SESClient,
  DescribeActiveReceiptRuleSetCommand,
} from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeActiveReceiptRuleSet: AppBlock = {
  name: "Describe Active Receipt Rule Set",
  description: `Returns the metadata and receipt rules for the receipt rule set that is currently active.`,
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeActiveReceiptRuleSetCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Active Receipt Rule Set Result",
      description: "Result from DescribeActiveReceiptRuleSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Metadata: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              CreatedTimestamp: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "The metadata for the currently active receipt rule set.",
          },
          Rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Enabled: {
                  type: "boolean",
                },
                TlsPolicy: {
                  type: "string",
                },
                Recipients: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                Actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      S3Action: {
                        type: "object",
                        additionalProperties: true,
                      },
                      BounceAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      WorkmailAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      LambdaAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      StopAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AddHeaderAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      SNSAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ConnectAction: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                ScanEnabled: {
                  type: "boolean",
                },
              },
              required: ["Name"],
              additionalProperties: false,
            },
            description:
              "The receipt rules that belong to the active rule set.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeActiveReceiptRuleSet;
