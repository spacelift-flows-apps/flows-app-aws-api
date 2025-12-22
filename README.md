# AWS API Apps

## Description

Collection of Flows apps for interacting with AWS services. This repository contains 37+ generated apps covering major AWS services including S3, DynamoDB, EC2, Lambda, ECS, CloudWatch, and more.

Apps are automatically generated from AWS API models using code generation scripts, ensuring comprehensive coverage of AWS operations.

## Configuration

Each AWS app requires standard AWS credentials:

- `accessKeyId` - AWS access key identifier (required)
- `secretAccessKey` - AWS secret access key (required, sensitive)
- `sessionToken` - AWS session token (optional, for temporary STS credentials)
- `assumeRoleArn` - IAM role ARN to assume (optional, for cross-account access)
- `endpoint` - Custom endpoint URL (optional, for LocalStack or AWS-compatible services)

## Available Apps

Includes apps for 37+ AWS services (S3, DynamoDB, EC2, Lambda, ECS, CloudWatch, IAM, and more). Each app provides blocks for operations specific to that service.

## Development

### Code Generation

Apps are generated using AWS API models:

```bash
npm run setup                    # Initialize AWS API models submodule
npm run update-models           # Update to latest AWS API models
npm run generate:service         # Generate app for specific AWS service
```

### Scripts

- `npm run setup` - Initialize git submodules for AWS API models
- `npm run update-models` - Update AWS API models to latest version
- `npm run generate` - Run the AWS app generator
- `npm run icon` - Process app icons
