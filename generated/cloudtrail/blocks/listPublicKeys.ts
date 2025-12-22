import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  ListPublicKeysCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listPublicKeys: AppBlock = {
  name: "List Public Keys",
  description: `Returns all public keys whose private keys were used to sign the digest files within the specified time range.`,
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
        StartTime: {
          name: "Start Time",
          description:
            "Optionally specifies, in UTC, the start of the time range to look up public keys for CloudTrail digest files.",
          type: "string",
          required: false,
        },
        EndTime: {
          name: "End Time",
          description:
            "Optionally specifies, in UTC, the end of the time range to look up public keys for CloudTrail digest files.",
          type: "string",
          required: false,
        },
        NextToken: {
          name: "Next Token",
          description: "Reserved for future use.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListPublicKeysCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Public Keys Result",
      description: "Result from ListPublicKeys operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          PublicKeyList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Value: {
                  type: "string",
                },
                ValidityStartTime: {
                  type: "string",
                },
                ValidityEndTime: {
                  type: "string",
                },
                Fingerprint: {
                  type: "string",
                },
              },
              additionalProperties: false,
            },
            description: "Contains an array of PublicKey objects.",
          },
          NextToken: {
            type: "string",
            description: "Reserved for future use.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default listPublicKeys;
