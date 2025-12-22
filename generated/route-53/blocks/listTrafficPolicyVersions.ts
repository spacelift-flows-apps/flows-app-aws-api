import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListTrafficPolicyVersionsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listTrafficPolicyVersions: AppBlock = {
  name: "List Traffic Policy Versions",
  description: `Gets information about all of the versions for a specified traffic policy.`,
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
            "Specify the value of Id of the traffic policy for which you want to list all versions.",
          type: "string",
          required: true,
        },
        TrafficPolicyVersionMarker: {
          name: "Traffic Policy Version Marker",
          description:
            "For your first request to ListTrafficPolicyVersions, don't include the TrafficPolicyVersionMarker parameter.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The maximum number of traffic policy versions that you want Amazon Route 53 to include in the response body for this request.",
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

        const command = new ListTrafficPolicyVersionsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Traffic Policy Versions Result",
      description: "Result from ListTrafficPolicyVersions operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          TrafficPolicies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Version: {
                  type: "number",
                },
                Name: {
                  type: "string",
                },
                Type: {
                  type: "string",
                },
                Document: {
                  type: "string",
                },
                Comment: {
                  type: "string",
                },
              },
              required: ["Id", "Version", "Name", "Type", "Document"],
              additionalProperties: false,
            },
            description:
              "A list that contains one TrafficPolicy element for each traffic policy version that is associated with the specified traffic policy.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more traffic policies to be listed.",
          },
          TrafficPolicyVersionMarker: {
            type: "string",
            description:
              "If IsTruncated is true, the value of TrafficPolicyVersionMarker identifies the first traffic policy that Amazon Route 53 will return if you submit another request.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the maxitems parameter in the ListTrafficPolicyVersions request that produced the current response.",
          },
        },
        required: [
          "TrafficPolicies",
          "IsTruncated",
          "TrafficPolicyVersionMarker",
          "MaxItems",
        ],
      },
    },
  },
};

export default listTrafficPolicyVersions;
