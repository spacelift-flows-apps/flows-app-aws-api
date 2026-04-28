import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const describeListeners: AppBlock = {
  name: "Describe Listeners",
  description: `Describes the specified listeners or the listeners for the specified Application Load Balancer, Network Load Balancer, or Gateway Load Balancer.`,
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
        LoadBalancerArn: {
          name: "Load Balancer Arn",
          description: "The Amazon Resource Name (ARN) of the load balancer.",
          type: "string",
          required: false,
        },
        ListenerArns: {
          name: "Listener Arns",
          description: "The Amazon Resource Names (ARN) of the listeners.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Marker: {
          name: "Marker",
          description: "The marker for the next set of results.",
          type: "string",
          required: false,
        },
        PageSize: {
          name: "Page Size",
          description:
            "The maximum number of results to return with this call.",
          type: "number",
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

        const client = new ElasticLoadBalancingv2Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new DescribeListenersCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Describe Listeners Result",
      description: "Result from DescribeListeners operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          Listeners: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ListenerArn: {
                  type: "string",
                },
                LoadBalancerArn: {
                  type: "string",
                },
                Port: {
                  type: "number",
                },
                Protocol: {
                  type: "string",
                },
                Certificates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      CertificateArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      IsDefault: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    additionalProperties: false,
                  },
                },
                SslPolicy: {
                  type: "string",
                },
                DefaultActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Type: {
                        type: "object",
                        additionalProperties: true,
                      },
                      TargetGroupArn: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthenticateOidcConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      AuthenticateCognitoConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      Order: {
                        type: "object",
                        additionalProperties: true,
                      },
                      RedirectConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      FixedResponseConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      ForwardConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                      JwtValidationConfig: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    required: ["Type"],
                    additionalProperties: false,
                  },
                },
                AlpnPolicy: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                MutualAuthentication: {
                  type: "object",
                  properties: {
                    Mode: {
                      type: "string",
                    },
                    TrustStoreArn: {
                      type: "string",
                    },
                    IgnoreClientCertificateExpiry: {
                      type: "boolean",
                    },
                    TrustStoreAssociationStatus: {
                      type: "string",
                    },
                    AdvertiseTrustStoreCaNames: {
                      type: "string",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
            description: "Information about the listeners.",
          },
          NextMarker: {
            type: "string",
            description:
              "If there are additional results, this is the marker for the next set of results.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default describeListeners;
