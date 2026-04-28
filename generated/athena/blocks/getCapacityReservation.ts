import { AppBlock, events } from "@slflows/sdk/v1";
import {
  AthenaClient,
  GetCapacityReservationCommand,
} from "@aws-sdk/client-athena";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getCapacityReservation: AppBlock = {
  name: "Get Capacity Reservation",
  description: `Returns information about the capacity reservation with the specified name.`,
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
        Name: {
          name: "Name",
          description: "The name of the capacity reservation.",
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

        const client = new AthenaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetCapacityReservationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Capacity Reservation Result",
      description: "Result from GetCapacityReservation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          CapacityReservation: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              Status: {
                type: "string",
              },
              TargetDpus: {
                type: "number",
              },
              AllocatedDpus: {
                type: "number",
              },
              LastAllocation: {
                type: "object",
                properties: {
                  Status: {
                    type: "string",
                  },
                  StatusMessage: {
                    type: "string",
                  },
                  RequestTime: {
                    type: "string",
                  },
                  RequestCompletionTime: {
                    type: "string",
                  },
                },
                required: ["Status", "RequestTime"],
                additionalProperties: false,
              },
              LastSuccessfulAllocationTime: {
                type: "string",
              },
              CreationTime: {
                type: "string",
              },
            },
            required: [
              "Name",
              "Status",
              "TargetDpus",
              "AllocatedDpus",
              "CreationTime",
            ],
            additionalProperties: false,
            description: "The requested capacity reservation structure.",
          },
        },
        required: ["CapacityReservation"],
      },
    },
  },
};

export default getCapacityReservation;
