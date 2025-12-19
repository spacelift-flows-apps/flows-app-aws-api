import { AppBlock, events } from "@slflows/sdk/v1";
import { SSMClient, UpdatePatchBaselineCommand } from "@aws-sdk/client-ssm";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const updatePatchBaseline: AppBlock = {
  name: "Update Patch Baseline",
  description: `Modifies an existing patch baseline.`,
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
        BaselineId: {
          name: "Baseline Id",
          description: "The ID of the patch baseline to update.",
          type: "string",
          required: true,
        },
        Name: {
          name: "Name",
          description: "The name of the patch baseline.",
          type: "string",
          required: false,
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
          description:
            "Assigns a new compliance severity level to an existing patch baseline.",
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
            "Indicates the status to be assigned to security patches that are available but not approved because they don't meet the installation criteria specified in the patch baseline.",
          type: "string",
          required: false,
        },
        Replace: {
          name: "Replace",
          description:
            "If True, then all fields that are required by the CreatePatchBaseline operation are also required for this API request.",
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

        const client = new SSMClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new UpdatePatchBaselineCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Update Patch Baseline Result",
      description: "Result from UpdatePatchBaseline operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          BaselineId: {
            type: "string",
            description: "The ID of the deleted patch baseline.",
          },
          Name: {
            type: "string",
            description: "The name of the patch baseline.",
          },
          OperatingSystem: {
            type: "string",
            description:
              "The operating system rule used by the updated patch baseline.",
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
            description:
              "A set of global filters used to exclude patches from the baseline.",
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
            description:
              "A set of rules used to include patches in the baseline.",
          },
          ApprovedPatches: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of explicitly approved patches for the baseline.",
          },
          ApprovedPatchesComplianceLevel: {
            type: "string",
            description:
              "The compliance severity level assigned to the patch baseline after the update completed.",
          },
          ApprovedPatchesEnableNonSecurity: {
            type: "boolean",
            description:
              "Indicates whether the list of approved patches includes non-security updates that should be applied to the managed nodes.",
          },
          RejectedPatches: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "A list of explicitly rejected patches for the baseline.",
          },
          RejectedPatchesAction: {
            type: "string",
            description:
              "The action specified to take on patches included in the RejectedPatches list.",
          },
          CreatedDate: {
            type: "string",
            description: "The date when the patch baseline was created.",
          },
          ModifiedDate: {
            type: "string",
            description: "The date when the patch baseline was last modified.",
          },
          Description: {
            type: "string",
            description: "A description of the patch baseline.",
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
            description:
              "Information about the patches to use to update the managed nodes, including target operating systems and source repositories.",
          },
          AvailableSecurityUpdatesComplianceStatus: {
            type: "string",
            description:
              "Indicates the compliance status of managed nodes for which security-related patches are available but were not approved.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default updatePatchBaseline;
