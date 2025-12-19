import { AppBlock, events } from "@slflows/sdk/v1";
import { RDSClient, DescribeDBProxyTargetsCommand } from "@aws-sdk/client-rds";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeDBProxyTargets: AppBlock = {
  name: "Describe DB Proxy Targets",
  description: `Returns information about DBProxyTarget objects.`,
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
        DBProxyName: {
          name: "DB Proxy Name",
          description: "The identifier of the DBProxyTarget to describe.",
          type: "string",
          required: true,
        },
        TargetGroupName: {
          name: "Target Group Name",
          description: "The identifier of the DBProxyTargetGroup to describe.",
          type: "string",
          required: false,
        },
        Filters: {
          name: "Filters",
          description: "This parameter is not currently supported.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Name: {
                  type: "string",
                },
                Values: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["Name", "Values"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description:
            "An optional pagination token provided by a previous request.",
          type: "string",
          required: false,
        },
        MaxRecords: {
          name: "Max Records",
          description:
            "The maximum number of records to include in the response.",
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

        const client = new RDSClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeDBProxyTargetsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe DB Proxy Targets Result",
      description: "Result from DescribeDBProxyTargets operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Targets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                TargetArn: {
                  type: "string",
                },
                Endpoint: {
                  type: "string",
                },
                TrackedClusterId: {
                  type: "string",
                },
                RdsResourceId: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                Type: {
                  type: "string",
                },
                Role: {
                  type: "string",
                },
                TargetHealth: {
                  type: "object",
                  properties: {
                    State: {
                      type: "string",
                    },
                    Reason: {
                      type: "string",
                    },
                    Description: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description:
              "An arbitrary number of DBProxyTarget objects, containing details of the corresponding targets.",
          },
          Marker: {
            type: "string",
            description:
              "An optional pagination token provided by a previous request.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeDBProxyTargets;
