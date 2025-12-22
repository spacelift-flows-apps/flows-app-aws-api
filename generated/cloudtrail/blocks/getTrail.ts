import { AppBlock, events } from "@slflows/sdk/v1";
import { CloudTrailClient, GetTrailCommand } from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getTrail: AppBlock = {
  name: "Get Trail",
  description: `Returns settings information for a specified trail.`,
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
        Name: {
          name: "Name",
          description:
            "The name or the Amazon Resource Name (ARN) of the trail for which you want to retrieve settings information.",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetTrailCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Trail Result",
      description: "Result from GetTrail operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Trail: {
            type: "object",
            properties: {
              Name: {
                type: "string",
              },
              S3BucketName: {
                type: "string",
              },
              S3KeyPrefix: {
                type: "string",
              },
              SnsTopicName: {
                type: "string",
              },
              SnsTopicARN: {
                type: "string",
              },
              IncludeGlobalServiceEvents: {
                type: "boolean",
              },
              IsMultiRegionTrail: {
                type: "boolean",
              },
              HomeRegion: {
                type: "string",
              },
              TrailARN: {
                type: "string",
              },
              LogFileValidationEnabled: {
                type: "boolean",
              },
              CloudWatchLogsLogGroupArn: {
                type: "string",
              },
              CloudWatchLogsRoleArn: {
                type: "string",
              },
              KmsKeyId: {
                type: "string",
              },
              HasCustomEventSelectors: {
                type: "boolean",
              },
              HasInsightSelectors: {
                type: "boolean",
              },
              IsOrganizationTrail: {
                type: "boolean",
              },
            },
            additionalProperties: false,
            description: "The settings for a trail.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getTrail;
