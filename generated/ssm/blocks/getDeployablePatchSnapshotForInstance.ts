import { AppBlock, events } from "@slflows/sdk/v1";
import {
  SSMClient,
  GetDeployablePatchSnapshotForInstanceCommand,
} from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getDeployablePatchSnapshotForInstance: AppBlock = {
  name: "Get Deployable Patch Snapshot For Instance",
  description: `Retrieves the current snapshot for the patch baseline the managed node uses.`,
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
        InstanceId: {
          name: "Instance Id",
          description:
            "The ID of the managed node for which the appropriate patch snapshot should be retrieved.",
          type: "string",
          required: true,
        },
        SnapshotId: {
          name: "Snapshot Id",
          description:
            "The snapshot ID provided by the user when running AWS-RunPatchBaseline.",
          type: "string",
          required: true,
        },
        BaselineOverride: {
          name: "Baseline Override",
          description:
            "Defines the basic information about a patch baseline override.",
          type: {
            type: "object",
            properties: {
              OperatingSystem: {
                type: "string",
                enum: [
                  "WINDOWS",
                  "AMAZON_LINUX",
                  "AMAZON_LINUX_2",
                  "AMAZON_LINUX_2022",
                  "UBUNTU",
                  "REDHAT_ENTERPRISE_LINUX",
                  "SUSE",
                  "CENTOS",
                  "ORACLE_LINUX",
                  "DEBIAN",
                  "MACOS",
                  "RASPBIAN",
                  "ROCKY_LINUX",
                  "ALMA_LINUX",
                  "AMAZON_LINUX_2023",
                ],
              },
              GlobalFilters: {
                type: "object",
                properties: {
                  PatchFilters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        Key: {
                          type: "string",
                          enum: [
                            "ARCH",
                            "ADVISORY_ID",
                            "BUGZILLA_ID",
                            "PATCH_SET",
                            "PRODUCT",
                            "PRODUCT_FAMILY",
                            "CLASSIFICATION",
                            "CVE_ID",
                            "EPOCH",
                            "MSRC_SEVERITY",
                            "NAME",
                            "PATCH_ID",
                            "SECTION",
                            "PRIORITY",
                            "REPOSITORY",
                            "RELEASE",
                            "SEVERITY",
                            "SECURITY",
                            "VERSION",
                          ],
                        },
                        Values: {
                          type: "array",
                          items: {},
                        },
                      },
                      required: ["Key", "Values"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["PatchFilters"],
                additionalProperties: false,
              },
              ApprovalRules: {
                type: "object",
                properties: {
                  PatchRules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        PatchFilterGroup: {
                          type: "object",
                          properties: {
                            PatchFilters: {},
                          },
                          required: ["PatchFilters"],
                          additionalProperties: false,
                        },
                        ComplianceLevel: {
                          type: "string",
                          enum: [
                            "CRITICAL",
                            "HIGH",
                            "MEDIUM",
                            "LOW",
                            "INFORMATIONAL",
                            "UNSPECIFIED",
                          ],
                        },
                        ApproveAfterDays: {
                          type: "number",
                        },
                        ApproveUntilDate: {
                          type: "string",
                        },
                        EnableNonSecurity: {
                          type: "boolean",
                        },
                      },
                      required: ["PatchFilterGroup"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["PatchRules"],
                additionalProperties: false,
              },
              ApprovedPatches: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              ApprovedPatchesComplianceLevel: {
                type: "string",
                enum: [
                  "CRITICAL",
                  "HIGH",
                  "MEDIUM",
                  "LOW",
                  "INFORMATIONAL",
                  "UNSPECIFIED",
                ],
              },
              RejectedPatches: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              RejectedPatchesAction: {
                type: "string",
                enum: ["ALLOW_AS_DEPENDENCY", "BLOCK"],
              },
              ApprovedPatchesEnableNonSecurity: {
                type: "boolean",
              },
              Sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Name: {
                      type: "string",
                    },
                    Products: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                    },
                    Configuration: {
                      type: "string",
                    },
                  },
                  required: ["Name", "Products", "Configuration"],
                  additionalProperties: false,
                },
              },
              AvailableSecurityUpdatesComplianceStatus: {
                type: "string",
                enum: ["COMPLIANT", "NON_COMPLIANT"],
              },
            },
            additionalProperties: false,
          },
          required: false,
        },
        UseS3DualStackEndpoint: {
          name: "Use S3Dual Stack Endpoint",
          description:
            "Specifies whether to use S3 dualstack endpoints for the patch snapshot download URL.",
          type: "boolean",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetDeployablePatchSnapshotForInstanceCommand(
          commandInput as any,
        );
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Deployable Patch Snapshot For Instance Result",
      description:
        "Result from GetDeployablePatchSnapshotForInstance operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          InstanceId: {
            type: "string",
            description: "The managed node ID.",
          },
          SnapshotId: {
            type: "string",
            description: "The user-defined snapshot ID.",
          },
          SnapshotDownloadUrl: {
            type: "string",
            description:
              "A pre-signed Amazon Simple Storage Service (Amazon S3) URL that can be used to download the patch snapshot.",
          },
          Product: {
            type: "string",
            description:
              "Returns the specific operating system (for example Windows Server 2012 or Amazon Linux 2015.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default getDeployablePatchSnapshotForInstance;
