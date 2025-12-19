import { AppBlock, events } from "@slflows/sdk/v1";
import { EC2Client, CreatePlacementGroupCommand } from "@aws-sdk/client-ec2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPlacementGroup: AppBlock = {
  name: "Create Placement Group",
  description: `Creates a placement group in which to launch instances.`,
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
        PartitionCount: {
          name: "Partition Count",
          description: "The number of partitions.",
          type: "number",
          required: false,
        },
        TagSpecifications: {
          name: "Tag Specifications",
          description: "The tags to apply to the new placement group.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ResourceType: {
                  type: "string",
                },
                Tags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Key: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Value: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        SpreadLevel: {
          name: "Spread Level",
          description: "Determines how placement groups spread instances.",
          type: "string",
          required: false,
        },
        DryRun: {
          name: "Dry Run",
          description:
            "Checks whether you have the required permissions for the operation, without actually making the request, and provides an error response.",
          type: "boolean",
          required: false,
        },
        GroupName: {
          name: "Group Name",
          description: "A name for the placement group.",
          type: "string",
          required: false,
        },
        Strategy: {
          name: "Strategy",
          description: "The placement strategy.",
          type: "string",
          required: false,
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

        const client = new EC2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new CreatePlacementGroupCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Placement Group Result",
      description: "Result from CreatePlacementGroup operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PlacementGroup: {
            type: "object",
            properties: {
              GroupName: {
                type: "string",
              },
              State: {
                type: "string",
              },
              Strategy: {
                type: "string",
              },
              PartitionCount: {
                type: "number",
              },
              GroupId: {
                type: "string",
              },
              Tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Value: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              GroupArn: {
                type: "string",
              },
              SpreadLevel: {
                type: "string",
              },
            },
            additionalProperties: false,
            description: "Information about the placement group.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPlacementGroup;
