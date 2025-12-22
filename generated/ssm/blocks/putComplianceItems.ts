import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, PutComplianceItemsCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const putComplianceItems: AppBlock = {
  name: "Put Compliance Items",
  description: `Registers a compliance type and other compliance details on a designated resource.`,
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
        ResourceId: {
          name: "Resource Id",
          description: "Specify an ID for this resource.",
          type: "string",
          required: true,
        },
        ResourceType: {
          name: "Resource Type",
          description: "Specify the type of resource.",
          type: "string",
          required: true,
        },
        ComplianceType: {
          name: "Compliance Type",
          description: "Specify the compliance type.",
          type: "string",
          required: true,
        },
        ExecutionSummary: {
          name: "Execution Summary",
          description:
            "A summary of the call execution that includes an execution ID, the type of execution (for example, C...",
          type: {
            type: "object",
            properties: {
              ExecutionTime: {
                type: "string",
              },
              ExecutionId: {
                type: "string",
              },
              ExecutionType: {
                type: "string",
              },
            },
            required: ["ExecutionTime"],
            additionalProperties: false,
          },
          required: true,
        },
        Items: {
          name: "Items",
          description:
            "Information about the compliance as defined by the resource type.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Id: {
                  type: "string",
                },
                Title: {
                  type: "string",
                },
                Severity: {
                  type: "string",
                },
                Status: {
                  type: "string",
                },
                Details: {
                  type: "object",
                  additionalProperties: {
                    type: "string",
                  },
                },
              },
              required: ["Severity", "Status"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        ItemContentHash: {
          name: "Item Content Hash",
          description: "MD5 or SHA-256 content hash.",
          type: "string",
          required: false,
        },
        UploadType: {
          name: "Upload Type",
          description: "The mode for uploading compliance items.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new PutComplianceItemsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Put Compliance Items Result",
      description: "Result from PutComplianceItems operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
    },
  },
};

export default putComplianceItems;
