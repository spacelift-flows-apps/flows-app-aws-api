import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, DeleteFleetsCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const deleteFleets: AppBlock = {
  name: "Delete Fleets",
  description: `Deletes the specified EC2 Fleet request.`,
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
        FleetIds: {
          name: "Fleet Ids",
          description: "The IDs of the EC2 Fleets.",
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
            "Indicates whether to terminate the associated instances when the EC2 Fleet is deleted.",
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DeleteFleetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Delete Fleets Result",
      description: "Result from DeleteFleets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          SuccessfulFleetDeletions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CurrentFleetState: {
                  type: "string",
                },
                PreviousFleetState: {
                  type: "string",
                },
                FleetId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the EC2 Fleets that are successfully deleted.",
          },
          UnsuccessfulFleetDeletions: {
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
                FleetId: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "Information about the EC2 Fleets that are not successfully deleted.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default deleteFleets;
