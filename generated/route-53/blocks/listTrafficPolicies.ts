import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListTrafficPoliciesCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTrafficPolicies: AppBlock = {
  name: "List Traffic Policies",
  description: `Gets information about the latest version for every traffic policy that is associated with the current Amazon Web Services account.`,
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
        TrafficPolicyIdMarker: {
          name: "Traffic Policy Id Marker",
          description:
            "(Conditional) For your first request to ListTrafficPolicies, don't include the TrafficPolicyIdMarker parameter.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "(Optional) The maximum number of traffic policies that you want Amazon Route 53 to return in response to this request.",
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

        const command = new ListTrafficPoliciesCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Traffic Policies Result",
      description: "Result from ListTrafficPolicies operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrafficPolicySummaries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
                LatestVersion: {
                  type: "number",
                },
                TrafficPolicyCount: {
                  type: "number",
                },
              },
              required: [
                "Id",
                "Name",
                "Type",
                "LatestVersion",
                "TrafficPolicyCount",
              ],
              additionalProperties: false,
            },
            description:
              "A list that contains one TrafficPolicySummary element for each traffic policy that was created by the current Amazon Web Services account.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more traffic policies to be listed.",
          },
          TrafficPolicyIdMarker: {
            type: "string",
            description:
              "If the value of IsTruncated is true, TrafficPolicyIdMarker is the ID of the first traffic policy in the next group of MaxItems traffic policies.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the MaxItems parameter in the ListTrafficPolicies request that produced the current response.",
          },
        },
        required: [
          "TrafficPolicySummaries",
          "IsTruncated",
          "TrafficPolicyIdMarker",
          "MaxItems",
        ],
      },
    },
  },
};

export default listTrafficPolicies;
