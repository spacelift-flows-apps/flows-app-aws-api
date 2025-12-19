import { AppBlock, events } from "@slflows/sdk/v1";
import {
  WAFClient,
  ListSqlInjectionMatchSetsCommand,
} from "@aws-sdk/client-waf";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listSqlInjectionMatchSets: AppBlock = {
  name: "List Sql Injection Match Sets",
  description: `This is AWS WAF Classic documentation.`,
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
        NextMarker: {
          name: "Next Marker",
          description:
            "If you specify a value for Limit and you have more SqlInjectionMatchSet objects than the value of Limit, AWS WAF returns a NextMarker value in the response that allows you to list another group of SqlInjectionMatchSets.",
          type: "string",
          required: false,
        },
        Limit: {
          name: "Limit",
          description:
            "Specifies the number of SqlInjectionMatchSet objects that you want AWS WAF to return for this request.",
          type: "number",
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

        const client = new WAFClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListSqlInjectionMatchSetsCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Sql Injection Match Sets Result",
      description: "Result from ListSqlInjectionMatchSets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          NextMarker: {
            type: "string",
            description:
              "If you have more SqlInjectionMatchSet objects than the number that you specified for Limit in the request, the response includes a NextMarker value.",
          },
          SqlInjectionMatchSets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                SqlInjectionMatchSetId: {
                  type: "string",
                },
                Name: {
                  type: "string",
                },
              },
              required: ["SqlInjectionMatchSetId", "Name"],
              additionalProperties: false,
            },
            description: "An array of SqlInjectionMatchSetSummary objects.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listSqlInjectionMatchSets;
