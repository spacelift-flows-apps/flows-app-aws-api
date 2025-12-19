import { AppBlock, events } from "@slflows/sdk/v1";
import { SESClient, DescribeReceiptRuleCommand } from "@aws-sdk/client-ses";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeReceiptRule: AppBlock = {
  name: "Describe Receipt Rule",
  description: `Returns the details of the specified receipt rule.`,
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
        RuleSetName: {
          name: "Rule Set Name",
          description:
            "The name of the receipt rule set that the receipt rule belongs to.",
          type: "string",
          required: true,
        },
        RuleName: {
          name: "Rule Name",
          description: "The name of the receipt rule.",
          type: "string",
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

        const client = new SESClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeReceiptRuleCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Receipt Rule Result",
      description: "Result from DescribeReceiptRule operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Rule: {
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
                      properties: {
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        BucketName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        ObjectKeyPrefix: {
                          type: "object",
                          additionalProperties: true,
                        },
                        KmsKeyArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IamRoleArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["BucketName"],
                      additionalProperties: false,
                    },
                    BounceAction: {
                      type: "object",
                      properties: {
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        SmtpReplyCode: {
                          type: "object",
                          additionalProperties: true,
                        },
                        StatusCode: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Message: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Sender: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["SmtpReplyCode", "Message", "Sender"],
                      additionalProperties: false,
                    },
                    WorkmailAction: {
                      type: "object",
                      properties: {
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        OrganizationArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["OrganizationArn"],
                      additionalProperties: false,
                    },
                    LambdaAction: {
                      type: "object",
                      properties: {
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        FunctionArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        InvocationType: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["FunctionArn"],
                      additionalProperties: false,
                    },
                    StopAction: {
                      type: "object",
                      properties: {
                        Scope: {
                          type: "object",
                          additionalProperties: true,
                        },
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["Scope"],
                      additionalProperties: false,
                    },
                    AddHeaderAction: {
                      type: "object",
                      properties: {
                        HeaderName: {
                          type: "object",
                          additionalProperties: true,
                        },
                        HeaderValue: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["HeaderName", "HeaderValue"],
                      additionalProperties: false,
                    },
                    SNSAction: {
                      type: "object",
                      properties: {
                        TopicArn: {
                          type: "object",
                          additionalProperties: true,
                        },
                        Encoding: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["TopicArn"],
                      additionalProperties: false,
                    },
                    ConnectAction: {
                      type: "object",
                      properties: {
                        InstanceARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                        IAMRoleARN: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["InstanceARN", "IAMRoleARN"],
                      additionalProperties: false,
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
            description:
              "A data structure that contains the specified receipt rule's name, actions, recipients, domains, enabled status, scan status, and Transport Layer Security (TLS) policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeReceiptRule;
