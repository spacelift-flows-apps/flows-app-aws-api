import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudControlClient,
  CancelResourceRequestCommand,
} from "@aws-sdk/client-cloudcontrol";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const cancelResourceRequest: AppBlock = {
  name: "Cancel Resource Request",
  description: `Cancels the specified resource operation request.`,
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
        RequestToken: {
          name: "Request Token",
          description:
            "The RequestToken of the ProgressEvent object returned by the resource operation request.",
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

        const client = new CloudControlClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CancelResourceRequestCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Cancel Resource Request Result",
      description: "Result from CancelResourceRequest operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          ProgressEvent: {
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
            description:
              "Represents the current status of a resource operation request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default cancelResourceRequest;
