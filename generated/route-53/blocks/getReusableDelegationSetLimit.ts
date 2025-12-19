import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  GetReusableDelegationSetLimitCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getReusableDelegationSetLimit: AppBlock = {
  name: "Get Reusable Delegation Set Limit",
  description: `Gets the maximum number of hosted zones that you can associate with the specified reusable delegation set.`,
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
        Type: {
          name: "Type",
          description:
            "Specify MAX_ZONES_BY_REUSABLE_DELEGATION_SET to get the maximum number of hosted zones that you can associate with the specified reusable delegation set.",
          type: "string",
          required: true,
        },
        DelegationSetId: {
          name: "Delegation Set Id",
          description:
            "The ID of the delegation set that you want to get the limit for.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetReusableDelegationSetLimitCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Reusable Delegation Set Limit Result",
      description: "Result from GetReusableDelegationSetLimit operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Limit: {
            type: "object",
            properties: {
              Type: {
                type: "string",
              },
              Value: {
                type: "number",
              },
            },
            required: ["Type", "Value"],
            additionalProperties: false,
            description:
              "The current setting for the limit on hosted zones that you can associate with the specified reusable delegation set.",
          },
          Count: {
            type: "number",
            description:
              "The current number of hosted zones that you can associate with the specified reusable delegation set.",
          },
        },
        required: ["Limit", "Count"],
      },
    },
  },
};

export default getReusableDelegationSetLimit;
