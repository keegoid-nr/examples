# nodejs-sam

This example details how to manually wrap the handler using SAM. It includes how to:

- set environment variables
- runtime handler
- add a layer
- deploy

Based on instructions:
https://docs.newrelic.com/docs/serverless-function-monitoring/aws-lambda-monitoring/enable-lambda-monitoring/enable-serverless-monitoring-aws-lambda-legacy/#node

## Setup

Create a `samconfig.toml` for parameter overrides:

```toml
version = 0.1

[default.deploy.parameters]
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "NRAccountId=1234567 NRTrustedAccountKey=1234567"
```
