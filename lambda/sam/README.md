# SAM CLI

Testing SAM CLI deployments with New Relic instrumentation

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Setup](#setup)
- [Deployment Steps](#deployment-steps)
- [Testing Steps](#testing-steps)
  - [Ruby](#ruby)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Setup

Create a `samconfig.toml` for parameter overrides in your project:

```toml
version = 0.1

[default.deploy.parameters]
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "NRAccountId=1234567 NRTrustedAccountKey=1234567 LicenseKeyName=NEW_RELIC_LICENSE_KEY_SECRET_NAME"
```

## Deployment Steps

1. Modify values in a `template.yaml` to suite your needs.
1. Modify `samconfig.toml` with your values.
1. Run the [deploy.sh](./deploy.sh) script to deploy an example.

The `deploy.sh` script takes the AWS region as an argument.

## Testing Steps

Once deployed successfully the test cases can be invoked using the aws cli:

### Ruby

```bash
# With event passed
aws lambda invoke --cli-binary-format raw-in-base64-out --payload file://src/ruby33/event.json --function-name kmullaney-sam-ruby-33 /dev/stdout
aws lambda invoke --cli-binary-format raw-in-base64-out --payload file://src/modular-ruby33/event.json --function-name kmullaney-sam-ruby-modular-33 /dev/stdout
aws lambda invoke --cli-binary-format raw-in-base64-out --payload file://src/namespaced-modules-ruby33/event.json --function-name kmullaney-sam-ruby-namespaced-module-33 /dev/stdout

# No event passed
aws lambda invoke --function-name kmullaney-sam-ruby-33 /dev/stdout
aws lambda invoke --function-name kmullaney-sam-ruby-modular-33 /dev/stdout
aws lambda invoke --function-name kmullaney-sam-ruby-namespaced-module-33 /dev/stdout
```
