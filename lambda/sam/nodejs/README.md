# nodejs-sam

These examples detail how to configure New Relic Lambda layers which includes the Node.js agent + Extension for shipping telemetry to New Relic.

Set in [template.yaml](./template.yaml):

- environment variables
- runtime
- layer arn

## Setup

Create a `samconfig.toml` for parameter overrides:

```toml
version = 0.1

[default.deploy.parameters]
parameter_overrides = "NRAccountId=1234567 NRTrustedAccountKey=1234567 SecretsManagerSecretName=YOUR_SECRET_NAME"
```
