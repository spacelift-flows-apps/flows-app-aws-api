import { AppBlock, events } from "@slflows/sdk/v1";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const invokeModel: AppBlock = {
  name: "Invoke Model",
  description: `Invokes the specified Amazon Bedrock model to run inference using the prompt and inference parameters provided in the request body.`,
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
        body: {
          name: "body",
          description:
            "The prompt and inference parameters in the format specified in the contentType in the header.",
          type: "string",
          required: false,
        },
        contentType: {
          name: "content Type",
          description: "The MIME type of the input data in the request.",
          type: "string",
          required: false,
        },
        accept: {
          name: "accept",
          description:
            "The desired MIME type of the inference body in the response.",
          type: "string",
          required: false,
        },
        modelId: {
          name: "model Id",
          description:
            "The unique identifier of the model to invoke to run inference.",
          type: "string",
          required: true,
        },
        trace: {
          name: "trace",
          description:
            "Specifies whether to enable or disable the Bedrock trace.",
          type: "string",
          required: false,
        },
        guardrailIdentifier: {
          name: "guardrail Identifier",
          description:
            "The unique identifier of the guardrail that you want to use.",
          type: "string",
          required: false,
        },
        guardrailVersion: {
          name: "guardrail Version",
          description: "The version number for the guardrail.",
          type: "string",
          required: false,
        },
        performanceConfigLatency: {
          name: "performance Config Latency",
          description: "Model performance settings for the request.",
          type: "string",
          required: false,
        },
        serviceTier: {
          name: "service Tier",
          description:
            "Specifies the processing tier type used for serving the request.",
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

        const client = new BedrockRuntimeClient({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new InvokeModelCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Invoke Model Result",
      description: "Result from InvokeModel operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          body: {
            type: "string",
            description:
              "Inference response from the model in the format specified in the contentType header.",
          },
          contentType: {
            type: "string",
            description: "The MIME type of the inference result.",
          },
          performanceConfigLatency: {
            type: "string",
            description: "Model performance settings for the request.",
          },
          serviceTier: {
            type: "string",
            description:
              "Specifies the processing tier type used for serving the request.",
          },
        },
        required: ["body", "contentType"],
      },
    },
  },
};

export default invokeModel;
