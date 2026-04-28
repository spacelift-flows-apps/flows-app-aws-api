import { AppBlock, events } from "@slflows/sdk/v1";
import {
  ElasticLoadBalancingv2Client,
  CreateListenerCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const createListener: AppBlock = {
  name: "Create Listener",
  description: `Creates a listener for the specified Application Load Balancer, Network Load Balancer, or Gateway Load Balancer.`,
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
          required: true,
        },
        Protocol: {
          name: "Protocol",
          description:
            "The protocol for connections from clients to the load balancer.",
          type: "string",
          required: false,
        },
        Port: {
          name: "Port",
          description: "The port on which the load balancer is listening.",
          type: "number",
          required: false,
        },
        SslPolicy: {
          name: "Ssl Policy",
          description:
            "[HTTPS and TLS listeners] The security policy that defines which protocols and ciphers are supported.",
          type: "string",
          required: false,
        },
        Certificates: {
          name: "Certificates",
          description:
            "[HTTPS and TLS listeners] The default certificate for the listener.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                CertificateArn: {
                  type: "string",
                },
                IsDefault: {
                  type: "boolean",
                },
              },
              additionalProperties: false,
            },
          },
          required: false,
        },
        DefaultActions: {
          name: "Default Actions",
          description: "The actions for the default rule.",
          type: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Type: {
                  type: "string",
                },
                TargetGroupArn: {
                  type: "string",
                },
                AuthenticateOidcConfig: {
                  type: "object",
                  properties: {
                    Issuer: {
                      type: "string",
                    },
                    AuthorizationEndpoint: {
                      type: "string",
                    },
                    TokenEndpoint: {
                      type: "string",
                    },
                    UserInfoEndpoint: {
                      type: "string",
                    },
                    ClientId: {
                      type: "string",
                    },
                    ClientSecret: {
                      type: "string",
                    },
                    SessionCookieName: {
                      type: "string",
                    },
                    Scope: {
                      type: "string",
                    },
                    SessionTimeout: {
                      type: "number",
                    },
                    AuthenticationRequestExtraParams: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    OnUnauthenticatedRequest: {
                      type: "string",
                    },
                    UseExistingClientSecret: {
                      type: "boolean",
                    },
                  },
                  required: [
                    "Issuer",
                    "AuthorizationEndpoint",
                    "TokenEndpoint",
                    "UserInfoEndpoint",
                    "ClientId",
                  ],
                  additionalProperties: false,
                },
                AuthenticateCognitoConfig: {
                  type: "object",
                  properties: {
                    UserPoolArn: {
                      type: "string",
                    },
                    UserPoolClientId: {
                      type: "string",
                    },
                    UserPoolDomain: {
                      type: "string",
                    },
                    SessionCookieName: {
                      type: "string",
                    },
                    Scope: {
                      type: "string",
                    },
                    SessionTimeout: {
                      type: "number",
                    },
                    AuthenticationRequestExtraParams: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                      },
                    },
                    OnUnauthenticatedRequest: {
                      type: "string",
                    },
                  },
                  required: [
                    "UserPoolArn",
                    "UserPoolClientId",
                    "UserPoolDomain",
                  ],
                  additionalProperties: false,
                },
                Order: {
                  type: "number",
                },
                RedirectConfig: {
                  type: "object",
                  properties: {
                    Protocol: {
                      type: "string",
                    },
                    Port: {
                      type: "string",
                    },
                    Host: {
                      type: "string",
                    },
                    Path: {
                      type: "string",
                    },
                    Query: {
                      type: "string",
                    },
                    StatusCode: {
                      type: "string",
                    },
                  },
                  required: ["StatusCode"],
                  additionalProperties: false,
                },
                FixedResponseConfig: {
                  type: "object",
                  properties: {
                    MessageBody: {
                      type: "string",
                    },
                    StatusCode: {
                      type: "string",
                    },
                    ContentType: {
                      type: "string",
                    },
                  },
                  required: ["StatusCode"],
                  additionalProperties: false,
                },
                ForwardConfig: {
                  type: "object",
                  properties: {
                    TargetGroups: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    TargetGroupStickinessConfig: {
                      type: "object",
                      properties: {
                        Enabled: {
                          type: "object",
                          additionalProperties: true,
                        },
                        DurationSeconds: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
                JwtValidationConfig: {
                  type: "object",
                  properties: {
                    JwksEndpoint: {
                      type: "string",
                    },
                    Issuer: {
                      type: "string",
                    },
                    AdditionalClaims: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                  },
                  required: ["JwksEndpoint", "Issuer"],
                  additionalProperties: false,
                },
              },
              required: ["Type"],
              additionalProperties: false,
            },
          },
          required: true,
        },
        AlpnPolicy: {
          name: "Alpn Policy",
          description:
            "[TLS listeners] The name of the Application-Layer Protocol Negotiation (ALPN) policy.",
          type: {
            type: "array",
            items: {
              type: "string",
            },
          },
          required: false,
        },
        Tags: {
          name: "Tags",
          description: "The tags to assign to the listener.",
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
              required: ["Key"],
              additionalProperties: false,
            },
          },
          required: false,
        },
        MutualAuthentication: {
          name: "Mutual Authentication",
          description:
            "[HTTPS listeners] The mutual authentication configuration information.",
          type: {
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

        const command = new CreateListenerCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Create Listener Result",
      description: "Result from CreateListener operation",
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
            description: "Information about the listener.",
          },
        },
        additionalProperties: true,
      },
    },
  },
};

export default createListener;
