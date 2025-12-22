import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudControlClient,
  ListResourceRequestsCommand,
} from "@aws-sdk/client-cloudcontrol";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listResourceRequests: AppBlock = {
  name: "List Resource Requests",
  description: `Returns existing resource operation requests.`,
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
        MaxResults: {
          name: "Max Results",
          description:
            "The maximum number of results to be returned with a single call.",
          type: "number",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "If the previous paginated request didn't return all of the remaining results, the response object's NextToken parameter value is set to a token.",
          type: "string",
          required: false,
        },
        ResourceRequestStatusFilter: {
          name: "Resource Request Status Filter",
          description: "The filter criteria to apply to the requests returned.",
          type: {
            type: "object",
            properties: {
              Operations: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["CREATE", "DELETE", "UPDATE"],
                },
              },
              OperationStatuses: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "PENDING",
                    "IN_PROGRESS",
                    "SUCCESS",
                    "FAILED",
                    "CANCEL_IN_PROGRESS",
                    "CANCEL_COMPLETE",
                  ],
                },
              },
            },
            additionalProperties: false,
          },
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

        const client = new CloudControlClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListResourceRequestsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Resource Requests Result",
      description: "Result from ListResourceRequests operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ResourceRequestStatusSummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TypeName: {
                  type: "string",
                },
                Identifier: {
                  type: "string",
                },
                RequestToken: {
                  type: "string",
                },
                HooksRequestToken: {
                  type: "string",
                },
                Operation: {
                  type: "string",
                  enum: ["CREATE", "DELETE", "UPDATE"],
                },
                OperationStatus: {
                  type: "string",
                  enum: [
                    "PENDING",
                    "IN_PROGRESS",
                    "SUCCESS",
                    "FAILED",
                    "CANCEL_IN_PROGRESS",
                    "CANCEL_COMPLETE",
                  ],
                },
                EventTime: {
                  type: "string",
                },
                ResourceModel: {
                  type: "string",
                },
                StatusMessage: {
                  type: "string",
                },
                ErrorCode: {
                  type: "string",
                  enum: [
                    "NotUpdatable",
                    "InvalidRequest",
                    "AccessDenied",
                    "UnauthorizedTaggingOperation",
                    "InvalidCredentials",
                    "AlreadyExists",
                    "NotFound",
                    "ResourceConflict",
                    "Throttling",
                    "ServiceLimitExceeded",
                    "NotStabilized",
                    "GeneralServiceException",
                    "ServiceInternalError",
                    "ServiceTimeout",
                    "NetworkFailure",
                    "InternalFailure",
                  ],
                },
                RetryAfter: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "The requests that match the specified filter criteria.",
          },
          NextToken: {
            type: "string",
            description:
              "If the request doesn't return all of the remaining results, NextToken is set to a token.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listResourceRequests;
