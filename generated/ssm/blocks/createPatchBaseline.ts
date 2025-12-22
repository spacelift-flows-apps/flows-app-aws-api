import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, CreatePatchBaselineCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createPatchBaseline: AppBlock = {
  name: "Create Patch Baseline",
  description: `Creates a patch baseline.`,
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
        OperatingSystem: {
          name: "Operating System",
          description:
            "Defines the operating system the patch baseline applies to.",
          type: "string",
          required: false,
        },
        Name: {
          name: "Name",
          description: "The name of the patch baseline.",
          type: "string",
          required: true,
        },
        GlobalFilters: {
          name: "Global Filters",
          description:
            "A set of global filters used to include patches in the baseline.",
          type: {
            type: "object",
            properties: {
              PatchFilters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    Key: {
                      type: "string",
                    },
                    Values: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
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
          required: false,
        },
        ApprovalRules: {
          name: "Approval Rules",
          description:
            "A set of rules used to include patches in the baseline.",
          type: {
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
                        PatchFilters: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["PatchFilters"],
                      additionalProperties: false,
                    },
                    ComplianceLevel: {
                      type: "string",
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
          required: false,
        },
        ApprovedPatches: {
          name: "Approved Patches",
          description:
            "A list of explicitly approved patches for the baseline.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        ApprovedPatchesComplianceLevel: {
          name: "Approved Patches Compliance Level",
          description: "Defines the compliance level for approved patches.",
          type: "string",
          required: false,
        },
        ApprovedPatchesEnableNonSecurity: {
          name: "Approved Patches Enable Non Security",
          description:
            "Indicates whether the list of approved patches includes non-security updates that should be applied to the managed nodes.",
          type: "boolean",
          required: false,
        },
        RejectedPatches: {
          name: "Rejected Patches",
          description:
            "A list of explicitly rejected patches for the baseline.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        RejectedPatchesAction: {
          name: "Rejected Patches Action",
          description:
            "The action for Patch Manager to take on patches included in the RejectedPackages list.",
          type: "string",
          required: false,
        },
        Description: {
          name: "Description",
          description: "A description of the patch baseline.",
          type: "string",
          required: false,
        },
        Sources: {
          name: "Sources",
          description:
            "Information about the patches to use to update the managed nodes, including target operating systems and source repositories.",
          type: {
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
          required: false,
        },
        AvailableSecurityUpdatesComplianceStatus: {
          name: "Available Security Updates Compliance Status",
          description:
            "Indicates the status you want to assign to security patches that are available but not approved because they don't meet the installation criteria specified in the patch baseline.",
          type: "string",
          required: false,
        },
        ClientToken: {
          name: "Client Token",
          description: "User-provided idempotency token.",
          type: "string",
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "Optional metadata that you assign to a resource.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Key: {
                  type: "string",
                },
                Value: {
                  type: "string",
                },
              },
              required: ["Key", "Value"],
              additionalProperties: false,
            },
          },
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

        const command = new CreatePatchBaselineCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Patch Baseline Result",
      description: "Result from CreatePatchBaseline operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BaselineId: {
            type: "string",
            description: "The ID of the created patch baseline.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createPatchBaseline;
