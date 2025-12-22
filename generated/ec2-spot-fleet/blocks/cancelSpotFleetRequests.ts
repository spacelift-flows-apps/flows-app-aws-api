import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CancelSpotFleetRequestsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const cancelSpotFleetRequests: AppBlock = {
  name: "Cancel Spot Fleet Requests",
  description: `Cancels the specified Spot Fleet requests.`,
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
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the action, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        SpotFleetRequestIds: {
          name: "Spot Fleet Request Ids",
          description: "The IDs of the Spot Fleet requests.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: true,
        },
        TerminateInstances: {
          name: "Terminate Instances",
          description:
            "Indicates whether to terminate the associated instances when the Spot Fleet request is canceled.",
          type: "boolean",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CancelSpotFleetRequestsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Cancel Spot Fleet Requests Result",
      description: "Result from CancelSpotFleetRequests operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SuccessfulFleetRequests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CurrentSpotFleetRequestState: {
                  type: "string",
                },
                PreviousSpotFleetRequestState: {
                  type: "string",
                },
                SpotFleetRequestId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the Spot Fleet requests that are successfully canceled.",
          },
          UnsuccessfulFleetRequests: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Error: {
                  type: "object",
                  properties: {
                    Code: {
                      type: "string",
                    },
                    Message: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
                SpotFleetRequestId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the Spot Fleet requests that are not successfully canceled.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default cancelSpotFleetRequests;
