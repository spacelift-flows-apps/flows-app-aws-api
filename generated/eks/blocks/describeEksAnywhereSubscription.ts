import { AppBlock, events } from "@slflows/sdk/v1";
import {
  EKSClient,
  DescribeEksAnywhereSubscriptionCommand,
} from "@aws-sdk/client-eks";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeEksAnywhereSubscription: AppBlock = {
  name: "Describe Eks Anywhere Subscription",
  description: `Returns descriptive information about a subscription.`,
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
        id: {
          name: "id",
          description: "The ID of the subscription.",
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

        const client = new EKSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeEksAnywhereSubscriptionCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Eks Anywhere Subscription Result",
      description: "Result from DescribeEksAnywhereSubscription operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          subscription: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              arn: {
                type: "string",
              },
              createdAt: {
                type: "string",
              },
              effectiveDate: {
                type: "string",
              },
              expirationDate: {
                type: "string",
              },
              licenseQuantity: {
                type: "number",
              },
              licenseType: {
                type: "string",
              },
              term: {
                type: "object",
                properties: {
                  duration: {
                    type: "number",
                  },
                  unit: {
                    type: "string",
                  },
                },
                additionalProperties: false,
              },
              status: {
                type: "string",
              },
              autoRenew: {
                type: "boolean",
              },
              licenseArns: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              licenses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                    },
                    token: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              tags: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
            description: "The full description of the subscription.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeEksAnywhereSubscription;
