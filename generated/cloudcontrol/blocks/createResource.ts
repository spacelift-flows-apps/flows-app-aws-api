import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudControlClient,
  CreateResourceCommand,
} from "@aws-sdk/client-cloudcontrol";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createResource: AppBlock = {
  name: "Create Resource",
  description: `Creates the specified resource.`,
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
        TypeName: {
          name: "Type Name",
          description: "The name of the resource type.",
          type: "string",
          required: true,
        },
        TypeVersionId: {
          name: "Type Version Id",
          description:
            "For private resource types, the type version to use in this resource operation.",
          type: "string",
          required: false,
        },
        RoleArn: {
          name: "Role Arn",
          description:
            "The Amazon Resource Name (ARN) of the Identity and Access Management (IAM) role for Cloud Control API to use when performing this resource operation.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description:
            "A unique identifier to ensure the idempotency of the resource request.",
          type: "string",
          required: false,
        },
        DesiredState: {
          name: "Desired State",
          description:
            "Structured data format representing the desired state of the resource, consisting of that resource's properties and their desired values.",
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

        const client = new CloudControlClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreateResourceCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Resource Result",
      description: "Result from CreateResource operation",
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
              "Represents the current status of the resource creation request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createResource;
