import { AppBlock, events } from "@slflows/sdk/v1";
import { LambdaClient, AddPermissionCommand } from "@aws-sdk/client-lambda";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const addPermission: AppBlock = {
  name: "Add Permission",
  description: `Grants a principal permission to use a function.`,
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
        FunctionName: {
          name: "Function Name",
          description:
            "The name or ARN of the Lambda function, version, or alias.",
          type: "string",
          required: true,
        },
        StatementId: {
          name: "Statement Id",
          description:
            "A statement identifier that differentiates the statement from others in the same policy.",
          type: "string",
          required: true,
        },
        Action: {
          name: "Action",
          description: "The action that the principal can use on the function.",
          type: "string",
          required: true,
        },
        Principal: {
          name: "Principal",
          description:
            "The Amazon Web Services service, Amazon Web Services account, IAM user, or IAM role that invokes the function.",
          type: "string",
          required: true,
        },
        SourceArn: {
          name: "Source Arn",
          description:
            "For Amazon Web Services services, the ARN of the Amazon Web Services resource that invokes the function.",
          type: "string",
          required: false,
        },
        SourceAccount: {
          name: "Source Account",
          description:
            "For Amazon Web Services service, the ID of the Amazon Web Services account that owns the resource.",
          type: "string",
          required: false,
        },
        EventSourceToken: {
          name: "Event Source Token",
          description:
            "For Alexa Smart Home functions, a token that the invoker must supply.",
          type: "string",
          required: false,
        },
        Qualifier: {
          name: "Qualifier",
          description:
            "Specify a version or alias to add permissions to a published version of the function.",
          type: "string",
          required: false,
        },
        RevisionId: {
          name: "Revision Id",
          description:
            "Update the policy only if the revision ID matches the ID that's specified.",
          type: "string",
          required: false,
        },
        PrincipalOrgID: {
          name: "Principal Org ID",
          description: "The identifier for your organization in Organizations.",
          type: "string",
          required: false,
        },
        FunctionUrlAuthType: {
          name: "Function Url Auth Type",
          description:
            "The type of authentication that your function URL uses.",
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

        const client = new LambdaClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new AddPermissionCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Add Permission Result",
      description: "Result from AddPermission operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Statement: {
            type: "string",
            description:
              "The permission statement that's added to the function policy.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default addPermission;
