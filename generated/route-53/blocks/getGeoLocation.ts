import { AppBlock, events } from "@slflows/sdk/v1";
import { Route53Client, GetGeoLocationCommand } from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const getGeoLocation: AppBlock = {
  name: "Get Geo Location",
  description: `Gets information about whether a specified geographic location is supported for Amazon Route 53 geolocation resource record sets.`,
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
        ContinentCode: {
          name: "Continent Code",
          description:
            "For geolocation resource record sets, a two-letter abbreviation that identifies a continent.",
          type: "string",
          required: false,
        },
        CountryCode: {
          name: "Country Code",
          description:
            "Amazon Route 53 uses the two-letter country codes that are specified in ISO standard 3166-1 alpha-2.",
          type: "string",
          required: false,
        },
        SubdivisionCode: {
          name: "Subdivision Code",
          description:
            "The code for the subdivision, such as a particular state within the United States.",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new GetGeoLocationCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "Get Geo Location Result",
      description: "Result from GetGeoLocation operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GeoLocationDetails: {
            type: "object",
            properties: {
              ContinentCode: {
                type: "string",
              },
              ContinentName: {
                type: "string",
              },
              CountryCode: {
                type: "string",
              },
              CountryName: {
                type: "string",
              },
              SubdivisionCode: {
                type: "string",
              },
              SubdivisionName: {
                type: "string",
              },
            },
            additionalProperties: false,
            description:
              "A complex type that contains the codes and full continent, country, and subdivision names for the specified geolocation code.",
          },
        },
        required: ["GeoLocationDetails"],
      },
    },
  },
};

export default getGeoLocation;
