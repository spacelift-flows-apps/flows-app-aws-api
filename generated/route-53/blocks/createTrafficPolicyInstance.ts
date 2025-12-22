import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  CreateTrafficPolicyInstanceCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createTrafficPolicyInstance: AppBlock = {
  name: "Create Traffic Policy Instance",
  description: `Creates resource record sets in a specified hosted zone based on the settings in a specified traffic policy version.`,
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
        HostedZoneId: {
          name: "Hosted Zone Id",
          description:
            "The ID of the hosted zone that you want Amazon Route 53 to create resource record sets in by using the configuration in a traffic policy.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The domain name (such as example.",
          type: "string",
          required: true,
        },
        TTL: {
          name: "TTL",
          description:
            "(Optional) The TTL that you want Amazon Route 53 to assign to all of the resource record sets that it creates in the specified hosted zone.",
          type: "number",
          required: true,
        },
        TrafficPolicyId: {
          name: "Traffic Policy Id",
          description:
            "The ID of the traffic policy that you want to use to create resource record sets in the specified hosted zone.",
          type: "string",
          required: true,
        },
        TrafficPolicyVersion: {
          name: "Traffic Policy Version",
          description:
            "The version of the traffic policy that you want to use to create resource record sets in the specified hosted zone.",
          type: "number",
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

        const command = new CreateTrafficPolicyInstanceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Traffic Policy Instance Result",
      description: "Result from CreateTrafficPolicyInstance operation",
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
              "A complex type that contains settings for the new traffic policy instance.",
          },
          Location: {
            type: "string",
            description:
              "A unique URL that represents a new traffic policy instance.",
          },
        },
        required: ["TrafficPolicyInstance", "Location"],
      },
    },
  },
};

export default createTrafficPolicyInstance;
