# Serverless

For use with New Relic's serverless-newrelic-lambda-layers plugin.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Plugins](#plugins)
- [Config](#config)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Plugins

serverless-newrelic-lambda-layers

## Config

Use a `.env` file, and add it to your `.gitignore` to avoid committing it:

```yaml
useDotenv: true
```

The `.env` file can be used to avoid putting sensitive values into the `serverless.yaml`:

```t
NEW_RELIC_ACCOUNT_ID=1234567
NEW_RELIC_TRUSTED_ACCOUNT_KEY=9876543
NEW_RELIC_LICENSE_KEY_SECRET=<your-license-key-secret-name> # this defaults to NEW_RELIC_LICENSE_KEY
NEW_RELIC_USER_API_KEY=NRAK-...
```

Environment variables:

```yaml
    NEW_RELIC_LICENSE_KEY_SECRET: ${env:NEW_RELIC_LICENSE_KEY_SECRET}
    NEW_RELIC_EXTENSION_LOG_LEVEL: DEBUG
    NEW_RELIC_NATIVE_METRICS_ENABLED: false                      # Reduce cold start duration by not collecting VM metrics
```

Plugin config:

```yaml
custom:
  newRelic:
    accountId: ${env:NEW_RELIC_ACCOUNT_ID}                       # New Relic account ID
    trustedAccountKey: ${env:NEW_RELIC_TRUSTED_ACCOUNT_KEY}      # New Relic account ID or parent ID
    apiKey: ${env:NEW_RELIC_USER_API_KEY}                        # User api key
```

Make sure to deploy all dependencies that are imported or required in the function.

```yaml
    package:
      patterns:
        - 'src/default/node_modules/**'
```
