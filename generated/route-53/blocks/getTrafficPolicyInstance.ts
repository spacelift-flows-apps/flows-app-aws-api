import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  GetTrafficPolicyInstanceCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTrafficPolicyInstance: AppBlock = {
  name: "Get Traffic Policy Instance",
  description: `Gets information about a specified traffic policy instance.`,
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
          description:
            "The ID of the traffic policy instance that you want to get information about.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetTrafficPolicyInstanceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Traffic Policy Instance Result",
      description: "Result from GetTrafficPolicyInstance operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrafficPolicyInstance: {
            type: "object",
            properties: {
              Id: {
                type: "string",
              },
              HostedZoneId: {
                type: "string",
              },
              Name: {
                type: "string",
              },
              TTL: {
                type: "number",
              },
              State: {
                type: "string",
              },
              Message: {
                type: "string",
              },
              TrafficPolicyId: {
                type: "string",
              },
              TrafficPolicyVersion: {
                type: "number",
              },
              TrafficPolicyType: {
                type: "string",
              },
            },
            required: [
              "Id",
              "HostedZoneId",
              "Name",
              "TTL",
              "State",
              "Message",
              "TrafficPolicyId",
              "TrafficPolicyVersion",
              "TrafficPolicyType",
            ],
            additionalProperties: false,
            description:
              "A complex type that contains settings for the traffic policy instance.",
          },
        },
        required: ["TrafficPolicyInstance"],
      },
    },
  },
};

export default getTrafficPolicyInstance;
