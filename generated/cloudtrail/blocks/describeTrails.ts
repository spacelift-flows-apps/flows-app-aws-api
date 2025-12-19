import { AppBlock, events } from "@slflows/sdk/v1";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from "@aws-sdk/client-cloudtrail";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeTrails: AppBlock = {
  name: "Describe Trails",
  description: `Retrieves settings for one or more trails associated with the current Region for your account.`,
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
        trailNameList: {
          name: "trail Name List",
          description:
            "Specifies a list of trail names, trail ARNs, or both, of the trails to describe.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        includeShadowTrails: {
          name: "include Shadow Trails",
          description:
            "Specifies whether to include shadow trails in the response.",
          type: "boolean",
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

        const client = new CloudTrailClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeTrailsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Trails Result",
      description: "Result from DescribeTrails operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          trailList: {
            type: "array",
            items: {
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
            },
            description: "The list of trail objects.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeTrails;
