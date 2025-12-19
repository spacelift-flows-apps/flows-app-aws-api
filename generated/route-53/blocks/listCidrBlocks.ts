import { AppBlock, events } from "@slflows/sdk/v1";
import { Route53Client, ListCidrBlocksCommand } from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listCidrBlocks: AppBlock = {
  name: "List Cidr Blocks",
  description: `Returns a paginated list of location objects and their CIDR blocks.`,
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
        CollectionId: {
          name: "Collection Id",
          description: "The UUID of the CIDR collection.",
          type: "string",
          required: true,
        },
        LocationName: {
          name: "Location Name",
          description: "The name of the CIDR collection location.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description:
            "An opaque pagination token to indicate where the service is to begin enumerating results.",
          type: "string",
          required: false,
        },
        MaxResults: {
          name: "Max Results",
          description: "Maximum number of results you want returned.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListCidrBlocksCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Cidr Blocks Result",
      description: "Result from ListCidrBlocks operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextToken: {
            type: "string",
            description:
              "An opaque pagination token to indicate where the service is to begin enumerating results.",
          },
          CidrBlocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CidrBlock: {
                  type: "string",
                },
                LocationName: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description:
              "A complex type that contains information about the CIDR blocks.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listCidrBlocks;
