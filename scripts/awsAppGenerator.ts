#!/usr/bin/env node

/**
 * AWS Flows App Generator
 *
 * Generates Flows apps from AWS API Models (Smithy JSON AST)
 * This prototype focuses on action blocks only (no resources)
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";

// Types for Smithy JSON AST structure
interface SmithyModel {
  smithy: string;
  metadata?: Record<string, any>;
  shapes: Record<string, SmithyShape>;
}

interface SmithyShape {
  type: string;
  traits?: Record<string, any>;
  members?: Record<string, SmithyMember>;
  target?: string;
  input?: { target: string };
  output?: { target: string };
  errors?: Array<{ target: string }>;
  member?: { target: string };
  value?: { target: string };
}

interface SmithyMember {
  target: string;
  traits?: Record<string, any>;
}

interface ServiceMetadata {
  apiVersion: string;
  endpointPrefix: string;
  protocol: string;
  serviceFullName: string;
  serviceId: string;
  signatureVersion: string;
}

interface Operation {
  name: string;
  input?: { target: string };
  output?: { target: string };
  errors?: Array<{ target: string }>;
  traits?: Record<string, any>;
}

interface ParsedService {
  metadata: ServiceMetadata;
  operations: Record<string, Operation>;
  shapes: Record<string, SmithyShape>;
}

interface ServiceBreakdown {
  service: string;
  description: string;
  apps: Record<
    string,
    {
      name: string;
      description: string;
      operations: string[];
    }
  >;
}

class AWSAppGenerator {
  private models: Map<string, ParsedService> = new Map();
  private breakdowns: Map<string, ServiceBreakdown> = new Map();

  /**
   * Load AWS API models from the api-models-aws repository
   */
  async loadModels(modelsPath: string) {
    console.log(`Loading AWS API models from ${modelsPath}...`);

    const servicesDir = path.join(modelsPath, "models");
    if (!fs.existsSync(servicesDir)) {
      throw new Error(`Models directory not found: ${servicesDir}`);
    }

    const services = fs
      .readdirSync(servicesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`Found ${services.length} AWS services`);

    // Load all services
    for (const service of services) {
      try {
        const serviceModel = await this.loadServiceModel(servicesDir, service);
        if (serviceModel) {
          this.models.set(service, serviceModel);
          console.log(`✓ Loaded ${service}`);
        }
      } catch (error: any) {
        console.warn(`⚠ Failed to load ${service}:`, error.message);
      }
    }

    console.log(`Successfully loaded ${this.models.size} service models`);

    // Load service breakdown configurations
    await this.loadBreakdownConfigurations();
  }

  /**
   * Generate Flows app for a specific AWS service
   */
  async generateServiceApp(serviceName: string, outputDir: string) {
    const service = this.models.get(serviceName);
    if (!service) {
      throw new Error(`Service model not loaded: ${serviceName}`);
    }

    const breakdown = this.breakdowns.get(serviceName);

    if (breakdown) {
      console.log(
        `Found breakdown configuration for ${serviceName}, generating ${
          Object.keys(breakdown.apps).length
        } separate apps...`,
      );

      // Generate separate directories for each breakdown category
      for (const [appKey, appConfig] of Object.entries(breakdown.apps)) {
        await this.generateBreakdownApp(
          service,
          breakdown,
          appKey,
          appConfig,
          outputDir,
        );
      }

      console.log(
        `✓ Generated ${
          Object.keys(breakdown.apps).length
        } separate apps for ${serviceName}`,
      );
      return;
    }
    console.log(
      `Generating single app for ${service.metadata.serviceFullName}...`,
    );

    // Generate single app as before
    const appDir = path.join(outputDir, serviceName);
    fs.mkdirSync(appDir, { recursive: true });

    await this.generateMainApp(service, appDir);
    const blocksDir = path.join(appDir, "blocks");
    fs.mkdirSync(blocksDir, { recursive: true });

    // Generate utility files for S3 service
    if (service.metadata.serviceId === "S3") {
      const utilsDir = path.join(appDir, "utils");
      fs.mkdirSync(utilsDir, { recursive: true });
      await this.generateS3SerializeUtility(utilsDir);
    }

    await this.generateActionBlocks(service, blocksDir);
    await this.generatePackageJson(service, appDir);
    await this.generateConfigs(appDir);
    await this.generateVersionFile(appDir);
    await this.formatCode(service, appDir);

    console.log(`✓ Generated ${serviceName} app in ${appDir}`);
  }

  /**
   * Load service breakdown configurations from JSON files
   */
  private async loadBreakdownConfigurations() {
    console.log("Loading service breakdown configurations...");

    // Look for breakdown files in the breakdowns directory
    const breakdownsDir = path.resolve("./breakdowns");

    try {
      if (!fs.existsSync(breakdownsDir)) {
        console.log(
          "No breakdowns directory found, proceeding without breakdowns",
        );
        return;
      }

      const breakdownFiles = fs
        .readdirSync(breakdownsDir)
        .filter((file: string) => file.endsWith("-breakdown.json"));

      for (const file of breakdownFiles) {
        try {
          const filePath = path.join(breakdownsDir, file);
          const content = fs.readFileSync(filePath, "utf8");
          const breakdown: ServiceBreakdown = JSON.parse(content);
          this.breakdowns.set(breakdown.service, breakdown);
          console.log(
            `✓ Loaded breakdown configuration for ${breakdown.service}`,
          );
        } catch (error: any) {
          console.warn(
            `⚠ Failed to load breakdown file ${file}:`,
            error.message,
          );
        }
      }
    } catch (error: any) {
      console.log(
        "Error reading breakdowns directory, proceeding without breakdowns",
      );
    }
  }

  private async loadServiceModel(
    servicesDir: string,
    serviceName: string,
  ): Promise<ParsedService | null> {
    const servicePath = path.join(servicesDir, serviceName, "service");

    if (!fs.existsSync(servicePath)) {
      return null;
    }

    const versions = fs
      .readdirSync(servicePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort()
      .reverse(); // Get latest version first

    if (versions.length === 0) {
      return null;
    }

    const latestVersion = versions[0];
    const modelPath = path.join(
      servicePath,
      latestVersion,
      `${serviceName}-${latestVersion}.json`,
    );

    if (!fs.existsSync(modelPath)) {
      return null;
    }

    const modelContent = fs.readFileSync(modelPath, "utf8");
    const model: SmithyModel = JSON.parse(modelContent);

    // Extract service metadata and operations
    const serviceShapeId = Object.keys(model.shapes).find(
      (id) => model.shapes[id].type === "service",
    );

    if (!serviceShapeId) {
      throw new Error(`No service shape found in ${serviceName}`);
    }

    const serviceShape = model.shapes[serviceShapeId];
    const metadata = serviceShape.traits?.["aws.api#service"] || {};

    const operations: Record<string, Operation> = {};

    // Find operations in the shapes
    for (const [shapeId, shape] of Object.entries(model.shapes)) {
      if (shape.type === "operation") {
        const opName = shapeId.split("#")[1];
        operations[opName] = {
          name: opName,
          input: shape.input,
          output: shape.output,
          errors: shape.errors || [],
          traits: shape.traits || {},
        };
      }
    }

    return {
      metadata: {
        apiVersion: metadata.sdkId || latestVersion,
        endpointPrefix: metadata.endpointPrefix || serviceName,
        protocol: serviceShape.traits?.["aws.protocols#restJson1"]
          ? "rest-json"
          : serviceShape.traits?.["aws.protocols#awsJson1_1"]
            ? "aws-json-1.1"
            : serviceShape.traits?.["aws.protocols#awsQuery"]
              ? "aws-query"
              : "unknown",
        serviceFullName: metadata.serviceFullName || serviceName,
        serviceId: metadata.sdkId || serviceName,
        signatureVersion: "v4",
      },
      operations,
      shapes: model.shapes,
    };
  }

  /**
   * Generate a separate app directory for a breakdown category
   */
  private async generateBreakdownApp(
    service: ParsedService,
    breakdown: ServiceBreakdown,
    appKey: string,
    appConfig: { name: string; description: string; operations: string[] },
    outputDir: string,
  ) {
    console.log(`Generating ${appConfig.name} app...`);

    // Create directory for this breakdown app
    const appDir = path.join(outputDir, appKey);
    fs.mkdirSync(appDir, { recursive: true });

    // Filter operations for this breakdown app
    const filteredOperations: Record<string, Operation> = {};
    const filteredBlocks: string[] = [];

    for (const opName of appConfig.operations) {
      if (service.operations[opName]) {
        filteredOperations[opName] = service.operations[opName];
        filteredBlocks.push(this.camelCase(opName));
      } else {
        console.warn(
          `⚠ Operation ${opName} not found in ${breakdown.service} service`,
        );
      }
    }

    // Create a filtered service object
    const filteredService: ParsedService = {
      ...service,
      operations: filteredOperations,
    };

    // Generate main.ts with all blocks
    const content = `import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks";

export const app = defineApp({
  name: "${appConfig.name}",
  config: {
    accessKeyId: {
      name: "AWS Access Key ID",
      description: "AWS access key identifier",
      type: "string",
      required: true,
    },
    secretAccessKey: {
      name: "AWS Secret Access Key", 
      description: "AWS secret access key",
      type: "string",
      required: true,
      sensitive: true,
    },
    sessionToken: {
      name: "AWS Session Token",
      description: "AWS session token (leave empty for IAM user credentials, required for temporary STS credentials)",
      type: "string",
      required: false,
      sensitive: true,
    },
    endpoint: {
      name: "Custom Endpoint",
      description: "Optional custom endpoint URL (useful for testing or AWS-compatible services like LocalStack)",
      type: "string",
      required: false,
    },
  },
  blocks,
});
`;

    fs.writeFileSync(path.join(appDir, "main.ts"), content);

    // Generate blocks directory with only filtered operations
    const blocksDir = path.join(appDir, "blocks");
    fs.mkdirSync(blocksDir, { recursive: true });
    await this.generateActionBlocks(filteredService, blocksDir);

    // Generate package.json and configs for this app
    await this.generatePackageJson(filteredService, appDir);
    await this.generateConfigs(appDir);
    await this.generateVersionFile(appDir);
    await this.formatCode(filteredService, appDir);

    console.log(`✓ Generated ${appConfig.name} app in ${appDir}`);
  }

  private async generateMainApp(service: ParsedService, appDir: string) {
    const content = `import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks";

export const app = defineApp({
  name: "${service.metadata.serviceFullName}",
  config: {
    accessKeyId: {
      name: "AWS Access Key ID",
      description: "AWS access key identifier",
      type: "string",
      required: true,
    },
    secretAccessKey: {
      name: "AWS Secret Access Key", 
      description: "AWS secret access key",
      type: "string",
      required: true,
      sensitive: true,
    },
    sessionToken: {
      name: "AWS Session Token",
      description: "AWS session token (leave empty for IAM user credentials, required for temporary STS credentials)",
      type: "string",
      required: false,
      sensitive: true,
    },
    endpoint: {
      name: "Custom Endpoint",
      description: "Optional custom endpoint URL (useful for testing or AWS-compatible services like LocalStack)",
      type: "string",
      required: false,
    },
  },
  blocks,
});
`;

    fs.writeFileSync(path.join(appDir, "main.ts"), content);
  }

  private async generateActionBlocks(
    service: ParsedService,
    blocksDir: string,
  ) {
    const operations = Object.values(service.operations);
    const blocks: string[] = [];

    for (const operation of operations) {
      // Generate all operations
      const blockName = this.camelCase(operation.name);
      const fileName = `${blockName}.ts`;

      await this.generateActionBlock(
        service,
        operation,
        path.join(blocksDir, fileName),
      );
      blocks.push(blockName);
    }

    // Generate index.ts for blocks
    const indexContent =
      blocks.map((block) => `import ${block} from './${block}';`).join("\n") +
      "\n\nexport const blocks = {\n" +
      blocks.map((block) => `  ${block},`).join("\n") +
      "\n};\n";

    fs.writeFileSync(path.join(blocksDir, "index.ts"), indexContent);
  }

  private async generateActionBlock(
    service: ParsedService,
    operation: Operation,
    filePath: string,
  ) {
    const clientName = this.getClientName(service.metadata.serviceId);
    const commandName = `${operation.name}Command`;
    const packageName = this.getSDKPackageName(service.metadata.serviceId);

    // Get input shape details
    const inputConfig = this.generateInputConfig(service, operation);
    const outputType = this.generateOutputType(service, operation);

    const isS3Service = service.metadata.serviceId === "S3";
    const imports = isS3Service
      ? `import { AppBlock, events } from "@slflows/sdk/v1";
import { ${clientName}, ${commandName} } from "${packageName}";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { serializeAWSResponse } from "../utils/serialize";`
      : `import { AppBlock, events } from "@slflows/sdk/v1";
import { ${clientName}, ${commandName} } from "${packageName}";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";`;

    const content = `${imports}

const ${this.camelCase(operation.name)}: AppBlock = {
  name: "${this.humanizeName(operation.name)}",
  description: \`${this.getOperationDescription(operation)}\`,
  inputs: {
    default: {
      config: ${JSON.stringify(inputConfig, null, 8).replace(/"/g, '"')},
      onEvent: async (input) => {
        const { region, assumeRoleArn, ...commandInput } = input.event.inputConfig;

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
            ...(input.app.config.endpoint && { endpoint: input.app.config.endpoint }),
          });

          const assumeRoleCommand = new AssumeRoleCommand({
            RoleArn: assumeRoleArn,
            RoleSessionName: \`flows-session-\${Date.now()}\`,
          });

          const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
          credentials = {
            accessKeyId: assumeRoleResponse.Credentials!.AccessKeyId!,
            secretAccessKey: assumeRoleResponse.Credentials!.SecretAccessKey!,
            sessionToken: assumeRoleResponse.Credentials!.SessionToken!,
          };
        } 
        
        const client = new ${clientName}({
          region: region,
          credentials: credentials,
          ...(input.app.config.endpoint && { endpoint: input.app.config.endpoint }),
        });

        const command = new ${commandName}(commandInput as any);
        const response = await client.send(command);

        ${
          isS3Service
            ? `// Safely serialize response by handling circular references and streams
        const safeResponse = await serializeAWSResponse(response);
        await events.emit(safeResponse || {});`
            : `await events.emit(response || {});`
        }
      },
    },
  },
  outputs: {
    default: {
      name: "${this.humanizeName(operation.name)} Result",
      description: "Result from ${operation.name} operation",
      possiblePrimaryParents: ["default"],
      type: ${JSON.stringify(outputType, null, 6)},
    },
  },
};

export default ${this.camelCase(operation.name)};
`;

    fs.writeFileSync(filePath, content);
  }

  private generateInputConfig(
    service: ParsedService,
    operation: Operation,
  ): Record<string, any> {
    const config: Record<string, any> = {
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
    };

    if (operation.input?.target) {
      const inputShape = service.shapes[operation.input.target];
      if (inputShape?.members) {
        for (const [memberName, member] of Object.entries(inputShape.members)) {
          const targetShape = service.shapes[member.target];
          config[memberName] = {
            name: this.humanizeName(memberName),
            description: this.getShapeDescription(member, targetShape),
            type: this.mapSmithyTypeToFlows(targetShape, service),
            required: this.isRequired(inputShape, memberName),
          };
        }
      }
    }

    return config;
  }

  private generateOutputType(
    service: ParsedService,
    operation: Operation,
  ): any {
    if (!operation.output?.target) {
      return { type: "object", additionalProperties: true };
    }

    const outputShape = service.shapes[operation.output.target];
    if (!outputShape?.members) {
      return { type: "object", additionalProperties: true };
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [memberName, member] of Object.entries(outputShape.members)) {
      const targetShape = service.shapes[member.target];
      const flowsType = this.mapSmithyTypeToFlows(targetShape, service);

      // For output properties, we need to flatten the type structure
      if (typeof flowsType === "object") {
        properties[memberName] = {
          ...flowsType,
          description: this.getShapeDescription(member, targetShape),
        };
      } else {
        properties[memberName] = {
          type: flowsType,
          description: this.getShapeDescription(member, targetShape),
        };
      }

      if (this.isRequired(outputShape, memberName)) {
        required.push(memberName);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : { additionalProperties: true }),
    };
  }

  private async generatePackageJson(service: ParsedService, appDir: string) {
    const packageName = this.getSDKPackageName(service.metadata.serviceId);

    const packageJson = {
      scripts: {
        typecheck: "npx tsc --noEmit",
        format: "npx prettier --write .",
        bundle: "npx flowctl version bundle -e main.ts",
      },
      dependencies: {
        "@slflows/sdk": "*",
        [packageName]: "^3.0.0",
        "@aws-sdk/client-sts": "^3.0.0",
      },
      devDependencies: {
        typescript: "^5.0.0",
        prettier: "^3.0.0",
        "@types/node": "^20.0.0",
        "@useflows/flowctl": "^0.1.1",
      },
      peerDependencies: {
        "@slflows/sdk": "*",
      },
    };

    fs.writeFileSync(
      path.join(appDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );

    // Run npm install
    console.log(`Installing dependencies for ${service.metadata.serviceId}...`);

    return new Promise<void>((resolve, reject) => {
      const npmInstall = spawn("npm", ["install"], {
        cwd: appDir,
        stdio: "pipe",
      });

      let output = "";
      npmInstall.stdout.on("data", (data) => {
        output += data.toString();
      });

      npmInstall.stderr.on("data", (data) => {
        output += data.toString();
      });

      npmInstall.on("close", (code) => {
        if (code === 0) {
          console.log(
            `✓ Dependencies installed for ${service.metadata.serviceId}`,
          );
          // Show what version was installed
          try {
            const packageLock = JSON.parse(
              fs.readFileSync(path.join(appDir, "package-lock.json"), "utf8"),
            );
            const sdkVersion =
              packageLock.packages?.["node_modules/@slflows/sdk"]?.version;
            if (sdkVersion) {
              console.log(`  @slflows/sdk version: ${sdkVersion}`);
            }
          } catch (e) {
            // Ignore if can't read package-lock.json
          }
          resolve();
        } else {
          console.error(
            `✗ npm install failed for ${service.metadata.serviceId}:`,
          );
          console.error(output);
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  private async generateVersionFile(appDir: string) {
    const versionFile = path.join(appDir, "VERSION");

    // Check if VERSION file already exists
    if (fs.existsSync(versionFile)) {
      console.log(`VERSION file already exists in ${appDir}, skipping...`);
      return;
    }

    // Create new VERSION file with default version
    fs.writeFileSync(versionFile, "0.1.0\n");
    console.log(`✓ Created VERSION file with 0.1.0 in ${appDir}`);
  }

  private async generateConfigs(appDir: string) {
    // Generate tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    };

    fs.writeFileSync(
      path.join(appDir, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2),
    );
  }

  private async formatCode(service: ParsedService, appDir: string) {
    console.log(`Formatting code for ${service.metadata.serviceId}...`);

    return new Promise<void>((resolve) => {
      const prettierFormat = spawn("npm", ["run", "format"], {
        cwd: appDir,
        stdio: "pipe",
      });

      let output = "";
      prettierFormat.stdout.on("data", (data) => {
        output += data.toString();
      });

      prettierFormat.stderr.on("data", (data) => {
        output += data.toString();
      });

      prettierFormat.on("close", (code) => {
        if (code === 0) {
          console.log(`✓ Code formatted for ${service.metadata.serviceId}`);
          resolve();
        } else {
          console.warn(
            `⚠ Code formatting failed for ${service.metadata.serviceId}:`,
          );
          console.warn(output);
          // Don't fail the whole generation for formatting issues
          resolve();
        }
      });
    });
  }

  private async generateS3SerializeUtility(utilsDir: string) {
    const content = `// Utility function to handle AWS SDK response serialization for S3
export async function serializeAWSResponse(response: any): Promise<any> {
  if (!response) return {};
  
  const { Body, ...safeResponse } = response;
  const result = { ...safeResponse };
  
  // Handle Body stream if it exists
  if (Body) {
    try {
      // Check if Body is a stream
      if (Body && typeof Body.pipe === 'function') {
        const chunks = [];
        for await (const chunk of Body) {
          chunks.push(chunk);
        }
        result.Body = Buffer.concat(chunks).toString('utf-8');
      } else if (Body && typeof Body.transformToString === 'function') {
        // Handle AWS SDK v3 streams
        result.Body = await Body.transformToString();
      } else {
        // If Body is already a string or simple value, use it directly
        result.Body = Body;
      }
    } catch (error) {
      // If stream reading fails, provide metadata about the body
      result.Body = '[Stream data - could not serialize]';
      result.BodyMetadata = {
        type: typeof Body,
        isStream: typeof Body.pipe === 'function',
        hasTransformToString: typeof Body.transformToString === 'function'
      };
    }
  }
  
  return result;
}
`;

    fs.writeFileSync(path.join(utilsDir, "serialize.ts"), content);
  }

  // Utility methods
  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private humanizeName(str: string): string {
    return (
      str
        // Handle acronyms (consecutive capitals) - keep them together
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        // Add space before capital letters that follow lowercase letters
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        // Clean up any double spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  private getClientName(serviceId: string): string {
    // Convert service ID to a valid client name by removing spaces and special characters
    const normalizedServiceId = serviceId
      .replace(/\s+/g, "") // Remove spaces
      .replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters except alphanumeric

    return `${normalizedServiceId
      .charAt(0)
      .toUpperCase()}${normalizedServiceId.slice(1)}Client`;
  }

  private getSDKPackageName(serviceId: string): string {
    // Convert service ID to a valid npm package name by replacing spaces and special characters with hyphens
    const normalizedServiceId = serviceId
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9\-]/g, "-") // Replace other special characters with hyphens
      .replace(/\-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return `@aws-sdk/client-${normalizedServiceId}`;
  }

  private getShapeDescription(
    member: SmithyMember,
    shape?: SmithyShape,
  ): string {
    // Try to get description from member traits first
    if (member.traits?.["smithy.api#documentation"]) {
      return this.cleanDocumentation(member.traits["smithy.api#documentation"]);
    }

    // Try to get description from the shape itself
    if (shape?.traits?.["smithy.api#documentation"]) {
      return this.cleanDocumentation(shape.traits["smithy.api#documentation"]);
    }

    // Fallback to generic description
    return "Parameter for the operation";
  }

  private getOperationDescription(operation: Operation): string {
    // Try to get from operation traits
    if (operation.traits?.["smithy.api#documentation"]) {
      return this.cleanDocumentation(
        operation.traits["smithy.api#documentation"],
      );
    }

    // Fallback to humanized name
    return this.humanizeName(operation.name);
  }

  private cleanDocumentation(doc: string): string {
    if (!doc) return "";

    // Remove HTML tags and clean up the text
    let cleaned = doc
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Extract first sentence (look for period followed by space or end of string)
    const firstSentenceMatch = cleaned.match(/^[^.]*\./);
    if (firstSentenceMatch) {
      return firstSentenceMatch[0];
    }

    // If no period found, take first 100 characters
    return cleaned.substring(0, 100) + (cleaned.length > 100 ? "..." : "");
  }

  private mapSmithyTypeToFlows(
    shape?: SmithyShape,
    service?: ParsedService,
    depth = 0,
  ): any {
    if (!shape) return "string";

    // Prevent infinite recursion
    if (depth > 3) return { type: "object", additionalProperties: true };

    switch (shape.type) {
      case "string":
        // Check for enum values
        if (shape.traits?.["smithy.api#enum"]) {
          const enumValues = shape.traits["smithy.api#enum"].map(
            (e: any) => e.value,
          );
          return { type: "string", enum: enumValues };
        }
        return "string";

      case "integer":
      case "long":
        return "number";

      case "float":
      case "double":
        return "number";

      case "boolean":
        return "boolean";

      case "list":
        // Try to get more specific item type
        const memberTarget = shape.member?.target;
        let itemType = { type: "any" };
        if (memberTarget && service) {
          const memberShape = service.shapes[memberTarget];
          if (memberShape) {
            itemType = this.mapSmithyTypeToFlows(
              memberShape,
              service,
              depth + 1,
            );
          }
        }
        return {
          type: "array",
          items: typeof itemType === "string" ? { type: itemType } : itemType,
        };

      case "map":
        // For maps, we need to conform to JsonSchema's additionalProperties constraint
        const valueTarget = shape.value?.target;
        if (valueTarget && service) {
          const valueShape = service.shapes[valueTarget];
          if (valueShape) {
            const mappedType = this.mapSmithyTypeToFlows(
              valueShape,
              service,
              depth + 1,
            );
            // If it's a simple type, use it
            if (typeof mappedType === "string") {
              return {
                type: "object",
                additionalProperties: {
                  type: mappedType as
                    | "string"
                    | "number"
                    | "boolean"
                    | "object"
                    | "array",
                },
              };
            }
            // If it's a complex type, simplify to just the base type for additionalProperties
            else if (mappedType.type) {
              return {
                type: "object",
                additionalProperties: {
                  type: mappedType.type as
                    | "string"
                    | "number"
                    | "boolean"
                    | "object"
                    | "array",
                },
              };
            }
          }
        }
        // Fallback to generic object
        return {
          type: "object",
          additionalProperties: { type: "object" },
        };

      case "structure":
        // For structures, we'll create proper object schemas
        if (shape.members && service) {
          const properties: Record<string, any> = {};
          const required: string[] = [];

          for (const [memberName, member] of Object.entries(shape.members)) {
            const memberShape = service.shapes[member.target];
            const memberType = this.mapSmithyTypeToFlows(
              memberShape,
              service,
              depth + 1,
            );

            // Ensure we always return proper JsonSchema objects for structure properties
            if (typeof memberType === "string") {
              properties[memberName] = { type: memberType };
            } else {
              properties[memberName] = memberType;
            }

            if (this.isRequired(shape, memberName)) {
              required.push(memberName);
            }
          }

          return {
            type: "object",
            properties,
            ...(required.length > 0 ? { required } : {}),
            additionalProperties: false,
          };
        }
        return { type: "object", additionalProperties: true };

      case "timestamp":
        return "string";

      default:
        return "string";
    }
  }

  private isRequired(shape: SmithyShape, memberName: string): boolean {
    // Check if the member is in the required list for the shape
    const requiredMembers = shape.traits?.["smithy.api#required"];
    if (Array.isArray(requiredMembers)) {
      return requiredMembers.includes(memberName);
    }

    // Check if the specific member has the required trait
    const member = shape.members?.[memberName];
    if (member?.traits?.["smithy.api#required"]) {
      return true;
    }

    return false;
  }
}

// Hardcoded list of services to generate
const SERVICES_TO_GENERATE = [
  "cloudcontrol",
  "cloudformation",
  "cloudfront",
  "cloudtrail",
  "cloudwatch",
  "dynamodb",
  "ec2",
  "ecr",
  "ecs",
  "eks",
  "eventbridge",
  "iam",
  "kms",
  "lambda",
  "rds",
  "redshift",
  "redshift-data",
  "route-53",
  "s3",
  "secrets-manager",
  "ses",
  "sns",
  "sqs",
  "ssm",
  "waf",
] as const;

// CLI interface
async function main() {
  const generator = new AWSAppGenerator();

  const modelsPath = "./aws-api-models";
  const outputDir = "./generated";

  // Check for command line arguments
  const args = process.argv.slice(2);
  const serviceName = args[0];

  try {
    await generator.loadModels(modelsPath);

    if (serviceName) {
      // Generate single service
      if (!SERVICES_TO_GENERATE.includes(serviceName as any)) {
        console.error(
          `❌ Service '${serviceName}' is not in the supported services list.`,
        );
        console.log(`Supported services: ${SERVICES_TO_GENERATE.join(", ")}`);
        process.exit(1);
      }

      console.log(`📦 Generating ${serviceName}...`);
      await generator.generateServiceApp(serviceName, outputDir);
      console.log(`✅ Successfully generated ${serviceName}`);
    } else {
      // Generate all services
      console.log(
        `Generating apps for ${SERVICES_TO_GENERATE.length} AWS services...`,
      );

      for (const serviceName of SERVICES_TO_GENERATE) {
        try {
          console.log(`\n📦 Generating ${serviceName}...`);
          await generator.generateServiceApp(serviceName, outputDir);
          console.log(`✅ Successfully generated ${serviceName}`);
        } catch (error: any) {
          console.error(`❌ Failed to generate ${serviceName}:`, error.message);
          // Continue with other services instead of failing completely
        }
      }

      console.log("\n🎉 Generation complete!");
    }
  } catch (error: any) {
    console.error("❌ Generation failed:", error.message);
    process.exit(1);
  }
}

main();
