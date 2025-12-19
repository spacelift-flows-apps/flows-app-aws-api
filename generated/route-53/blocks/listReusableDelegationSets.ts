import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListReusableDelegationSetsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listReusableDelegationSets: AppBlock = {
  name: "List Reusable Delegation Sets",
  description: `Retrieves a list of the reusable delegation sets that are associated with the current Amazon Web Services account.`,
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
            "If the value of IsTruncated in the previous response was true, you have more reusable delegation sets.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "The number of reusable delegation sets that you want Amazon Route 53 to return in the response to this request.",
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

        const command = new ListReusableDelegationSetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Reusable Delegation Sets Result",
      description: "Result from ListReusableDelegationSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          DelegationSets: {
            type: "array",
            items: {
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
            },
            description:
              "A complex type that contains one DelegationSet element for each reusable delegation set that was created by the current Amazon Web Services account.",
          },
          Marker: {
            type: "string",
            description:
              "For the second and subsequent calls to ListReusableDelegationSets, Marker is the value that you specified for the marker parameter in the request that produced the current response.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A flag that indicates whether there are more reusable delegation sets to be listed.",
          },
          NextMarker: {
            type: "string",
            description:
              "If IsTruncated is true, the value of NextMarker identifies the next reusable delegation set that Amazon Route 53 will return if you submit another ListReusableDelegationSets request and specify the value of NextMarker in the marker parameter.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for the maxitems parameter in the call to ListReusableDelegationSets that produced the current response.",
          },
        },
        required: ["DelegationSets", "Marker", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listReusableDelegationSets;
