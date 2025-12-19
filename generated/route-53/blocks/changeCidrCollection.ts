import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ChangeCidrCollectionCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const changeCidrCollection: AppBlock = {
  name: "Change Cidr Collection",
  description: `Creates, changes, or deletes CIDR blocks within a collection.`,
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
        Id: {
          name: "Id",
          description: "The UUID of the CIDR collection to update.",
          type: "string",
          required: true,
        },
        CollectionVersion: {
          name: "Collection Version",
          description:
            "A sequential counter that Amazon Route 53 sets to 1 when you create a collection and increments it by 1 each time you update the collection.",
          type: "number",
          required: false,
        },
        Changes: {
          name: "Changes",
          description: "Information about changes to a CIDR collection.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                LocationName: {
                  type: "string",
                },
                Action: {
                  type: "string",
                },
                CidrList: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["LocationName", "Action", "CidrList"],
              additionalProperties: false,
            },
          },
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ChangeCidrCollectionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Change Cidr Collection Result",
      description: "Result from ChangeCidrCollection operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Id: {
            type: "string",
            description: "The ID that is returned by ChangeCidrCollection.",
          },
        },
        required: ["Id"],
      },
    },
  },
};

export default changeCidrCollection;
