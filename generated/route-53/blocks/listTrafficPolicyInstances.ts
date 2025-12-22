import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListTrafficPolicyInstancesCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTrafficPolicyInstances: AppBlock = {
  name: "List Traffic Policy Instances",
  description: `Gets information about the traffic policy instances that you created by using the current Amazon Web Services account.`,
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
        HostedZoneIdMarker: {
          name: "Hosted Zone Id Marker",
          description:
            "If the value of IsTruncated in the previous response was true, you have more traffic policy instances.",
          type: "string",
          required: false,
        },
        TrafficPolicyInstanceNameMarker: {
          name: "Traffic Policy Instance Name Marker",
          description:
            "If the value of IsTruncated in the previous response was true, you have more traffic policy instances.",
          type: "string",
          required: false,
        },
        TrafficPolicyInstanceTypeMarker: {
          name: "Traffic Policy Instance Type Marker",
          description:
            "If the value of IsTruncated in the previous response was true, you have more traffic policy instances.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of traffic policy instances that you want Amazon Route 53 to return in response to a ListTrafficPolicyInstances request.",
          type: "string",
          required: false,
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListTrafficPolicyInstancesCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Traffic Policy Instances Result",
      description: "Result from ListTrafficPolicyInstances operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrafficPolicyInstances: {
            type: "array",
            items: {
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
            },
            description:
              "A list that contains one TrafficPolicyInstance element for each traffic policy instance that matches the elements in the request.",
          },
          HostedZoneIdMarker: {
            type: "string",
            description:
              "If IsTruncated is true, HostedZoneIdMarker is the ID of the hosted zone of the first traffic policy instance that Route 53 will return if you submit another ListTrafficPolicyInstances request.",
          },
          TrafficPolicyInstanceNameMarker: {
            type: "string",
            description:
              "If IsTruncated is true, TrafficPolicyInstanceNameMarker is the name of the first traffic policy instance that Route 53 will return if you submit another ListTrafficPolicyInstances request.",
          },
          TrafficPolicyInstanceTypeMarker: {
            type: "string",
            description:
              "If IsTruncated is true, TrafficPolicyInstanceTypeMarker is the DNS type of the resource record sets that are associated with the first traffic policy instance that Amazon Route 53 will return if you submit another ListTrafficPolicyInstances request.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more traffic policy instances to be listed.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the MaxItems parameter in the call to ListTrafficPolicyInstances that produced the current response.",
          },
        },
        required: ["TrafficPolicyInstances", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listTrafficPolicyInstances;
