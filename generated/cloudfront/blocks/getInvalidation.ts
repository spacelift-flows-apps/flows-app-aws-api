import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  GetInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getInvalidation: AppBlock = {
  name: "Get Invalidation",
  description: `Get the information about an invalidation.`,
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
        DistributionId: {
          name: "Distribution Id",
          description: "The distribution's ID.",
          type: "string",
          required: true,
        },
        Id: {
          name: "Id",
          description:
            "The identifier for the invalidation request, for example, IDFDVBD632BHDS5.",
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

        const client = new CloudFrontClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetInvalidationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Invalidation Result",
      description: "Result from GetInvalidation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Invalidation: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              CreateTime: {
                type: "string",
              },
              InvalidationBatch: {
                type: "object",
                properties: {
                  Paths: {
                    type: "object",
                    properties: {
                      Quantity: {
                        type: "number",
                      },
                      Items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                    },
                    required: ["Quantity"],
                    additionalProperties: false,
                  },
                  CallerReference: {
                    type: "string",
                  },
                },
                required: ["Paths", "CallerReference"],
                additionalProperties: false,
              },
            },
            required: ["Id", "Status", "CreateTime", "InvalidationBatch"],
            additionalProperties: false,
            description: "The invalidation's information.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getInvalidation;
