import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudFrontClient,
  ListDistributionsByOriginRequestPolicyIdCommand,
} from "@aws-sdk/client-cloudfront";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listDistributionsByOriginRequestPolicyId: AppBlock = {
  name: "List Distributions By Origin Request Policy Id",
  description: `Gets a list of distribution IDs for distributions that have a cache behavior that's associated with the specified origin request policy.`,
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
        Marker: {
          name: "Marker",
          description:
            "Use this field when paginating results to indicate where to begin in your list of distribution IDs.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of distribution IDs that you want in the response.",
          type: "number",
          required: false,
        },
        OriginRequestPolicyId: {
          name: "Origin Request Policy Id",
          description:
            "The ID of the origin request policy whose associated distribution IDs you want to list.",
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

        const command = new ListDistributionsByOriginRequestPolicyIdCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Distributions By Origin Request Policy Id Result",
      description:
        "Result from ListDistributionsByOriginRequestPolicyId operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DistributionIdList: {
            type: "object",
            properties: {
              Marker: {
                type: "string",
              },
              NextMarker: {
                type: "string",
              },
              MaxItems: {
                type: "number",
              },
              IsTruncated: {
                type: "boolean",
              },
              Quantity: {
                type: "number",
              },
              Items: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["Marker", "MaxItems", "IsTruncated", "Quantity"],
            additionalProperties: false,
            description: "A list of distribution IDs.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listDistributionsByOriginRequestPolicyId;
