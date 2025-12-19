import { AppBlock, events } from "@slflows/sdk/v1";
import {
  Route53Client,
  ListGeoLocationsCommand,
} from "@aws-sdk/client-route-53";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const listGeoLocations: AppBlock = {
  name: "List Geo Locations",
  description: `Retrieves a list of supported geographic locations.`,
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
        StartContinentCode: {
          name: "Start Continent Code",
          description:
            "The code for the continent with which you want to start listing locations that Amazon Route 53 supports for geolocation.",
          type: "string",
          required: false,
        },
        StartCountryCode: {
          name: "Start Country Code",
          description:
            "The code for the country with which you want to start listing locations that Amazon Route 53 supports for geolocation.",
          type: "string",
          required: false,
        },
        StartSubdivisionCode: {
          name: "Start Subdivision Code",
          description:
            "The code for the state of the United States with which you want to start listing locations that Amazon Route 53 supports for geolocation.",
          type: "string",
          required: false,
        },
        MaxItems: {
          name: "Max Items",
          description:
            "(Optional) The maximum number of geolocations to be included in the response body for this request.",
          type: "string",
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

        const client = new Route53Client({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && {
            endpoint: input.app.config.endpoint,
          }),
        });

        const command = new ListGeoLocationsCommand(commandInput as any);
        const response = await client.send(command);

        await events.emit(response || {});
      },
    },
  },
  outputs: {
    default: {
      name: "List Geo Locations Result",
      description: "Result from ListGeoLocations operation",
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          GeoLocationDetailsList: {
            type: "array",
            items: {
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
            },
            description:
              "A complex type that contains one GeoLocationDetails element for each location that Amazon Route 53 supports for geolocation.",
          },
          IsTruncated: {
            type: "boolean",
            description:
              "A value that indicates whether more locations remain to be listed after the last location in this response.",
          },
          NextContinentCode: {
            type: "string",
            description:
              "If IsTruncated is true, you can make a follow-up request to display more locations.",
          },
          NextCountryCode: {
            type: "string",
            description:
              "If IsTruncated is true, you can make a follow-up request to display more locations.",
          },
          NextSubdivisionCode: {
            type: "string",
            description:
              "If IsTruncated is true, you can make a follow-up request to display more locations.",
          },
          MaxItems: {
            type: "string",
            description:
              "The value that you specified for MaxItems in the request.",
          },
        },
        required: ["GeoLocationDetailsList", "IsTruncated", "MaxItems"],
      },
    },
  },
};

export default listGeoLocations;
