import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  CreateReusableDelegationSetCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createReusableDelegationSet: AppBlock = {
  name: "Create Reusable Delegation Set",
  description: `Creates a delegation set (a group of four name servers) that can be reused by multiple hosted zones that were created by the same Amazon Web Services account.`,
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
        CallerReference: {
          name: "Caller Reference",
          description:
            "A unique string that identifies the request, and that allows you to retry failed CreateReusableDelegationSet requests without the risk of executing the operation twice.",
          type: "string",
          required: true,
        },
        HostedZoneId: {
          name: "Hosted Zone Id",
          description:
            "If you want to mark the delegation set for an existing hosted zone as reusable, the ID for that hosted zone.",
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

        const command = new CreateReusableDelegationSetCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Reusable Delegation Set Result",
      description: "Result from CreateReusableDelegationSet operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DelegationSet: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              CallerReference: {
                type: "string",
              },
              NameServers: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["NameServers"],
            additionalProperties: false,
            description:
              "A complex type that contains name server information.",
          },
          Location: {
            type: "string",
            description:
              "The unique URL representing the new reusable delegation set.",
          },
        },
        required: ["DelegationSet", "Location"],
      },
    },
  },
};

export default createReusableDelegationSet;
