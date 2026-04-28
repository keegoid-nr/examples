# SAM CLI

Testing SAM CLI deployments with New Relic instrumentation

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Layer Naming Convention](#layer-naming-convention)
- [Finding the Latest Layer Versions](#finding-the-latest-layer-versions)
- [Deployment Steps](#deployment-steps)
  - [Node.js](#nodejs)
  - [Python](#python)
  - [Other runtimes](#other-runtimes)
- [Testing Steps](#testing-steps)
  - [Node.js](#nodejs-1)
    - [dt-incoming](#dt-incoming)
  - [Ruby](#ruby)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Layer Naming Convention

New Relic Lambda layers now follow a **unified naming convention**: one layer name covers all supported runtime versions for a language family, rather than a separate layer per runtime version.

| Runtime family | x86_64 layer | arm64 layer | Supported runtimes |
|----------------|-------------|-------------|--------------------|
| Node.js (full) | `NewRelicNodeJS` | `NewRelicNodeJSARM64` | nodejs20.x, nodejs22.x, nodejs24.x |
| Node.js (slim) | `NewRelicNodeJS-slim` | `NewRelicNodeJSARM64-slim` | nodejs20.x, nodejs22.x, nodejs24.x |
| Python | `NewRelicPython` | `NewRelicPythonARM64` | python3.9–3.14 |
| .NET | `NewRelicDotnet` | `NewRelicDotnetARM64` | dotnet6, dotnet8, dotnet10 |
| Extension only | `NewRelicLambdaExtension` | `NewRelicLambdaExtensionARM64` | any (OS runtime) |

The `-slim` Node.js variant excludes the OpenTelemetry bridge — use it for APM mode or when OTel is not needed.

Older per-version layers (`NewRelicNodeJS22X`, `NewRelicPython312`, etc.) still exist for backward compatibility but will not receive new features going forward.

## Finding the Latest Layer Versions

Query the Layer API for any AWS region to get current version numbers:

```bash
curl https://us-west-2.layers.newrelic-external.com/get-layers | jq '.Layers[] | {name: .LayerName, version: .LatestMatchingVersion.Version, runtimes: .LatestMatchingVersion.CompatibleRuntimes}'
```

Or filter by runtime:

```bash
curl "https://us-west-2.layers.newrelic-external.com/get-layers?CompatibleRuntime=nodejs22.x" | jq '.Layers[] | {name: .LayerName, version: .LatestMatchingVersion.Version}'
```

Replace `us-west-2` with your target region — layer versions can differ per region.

## Deployment Steps

### Node.js

Each Node.js example lives in its own directory under `nodejs/src/` with its own `template.yaml`.

1. Create a `samconfig.toml` in the `nodejs/` directory with your parameter values:

   ```toml
   version = 0.1

   [default.deploy.parameters]
   parameter_overrides = "NewRelicAccountId=1234567 NewRelicTrustedAccountKey=1234567 LicenseKeyName=YOUR_SECRET_NAME"
   ```

   The deploy script always reads `samconfig.toml` from the `nodejs/` root, so you only need one file regardless of which example you deploy.

2. Run the [deploy.sh](./nodejs/deploy.sh) script from the `nodejs/` directory, passing the region and example name:

   ```bash
   cd nodejs
   ./deploy.sh <region> <example>
   ```

   Available examples:

   | Example | Description |
   |---------|-------------|
   | `esm` | ESM Lambda with `newrelic-esm-lambda-wrapper` in APM mode |
   | `extension-only` | Extension-only layer with vendored agent (layerless instrumentation) |
   | `record-metric` | Custom events, attributes, and `recordMetric` |
   | `default` | Standard layer wrapper on nodejs20.x arm64 |
   | `aws-sdk-issue` | aws-sdk v2 instrumentation reproduction |
   | `no-outbound-vpc` | VPC with no outbound access (extension timeout reproduction) |
   | `dt-incoming` | Troubleshoot incoming DT headers from a POST request |
   | `local-invoke` | Locally-bundled extension layer for `sam local invoke` testing |
   | `sdk-cw-esm` | ESM Lambda using SDK method with CloudWatch log shipping |
   | `sdk-cw-record-metric` | SDK method recording custom metrics with CloudWatch log shipping |

   Example:

   ```bash
   ./deploy.sh us-west-2 esm
   ```

### Python

Each Python example lives in its own directory under `python/src/` with its own `template.yaml`.

1. Create a `samconfig.toml` in the `python/` directory with your parameter values:

   ```toml
   version = 0.1

   [default.deploy.parameters]
   parameter_overrides = "NRAccountId=1234567 NRTrustedAccountKey=1234567 LicenseKeyName=YOUR_SECRET_NAME"
   ```

2. Run the [deploy.sh](./python/deploy.sh) script from the `python/` directory:

   ```bash
   cd python
   ./deploy.sh <region> <example>
   ```

   Available examples:

   | Example | Description |
   |---------|-------------|
   | `python311sqs` | Python 3.11 with SQS trigger (CloudWatch shipping) |
   | `python311eventbridge` | Python 3.11 with EventBridge trigger and custom payload (CloudWatch shipping) |
   | `python312` | Python 3.12 with custom attribute and event (extension shipping) |
   | `python310dynamodb` | Python 3.10 writing to DynamoDB (extension shipping) |

   Standalone subdirectories with their own `deploy.sh` and `samconfig.toml`:

   | Directory | Description |
   |-----------|-------------|
   | `apm-mode/` | Python Lambda in APM + Serverless convergence mode |
   | `timeout-testing/` | Request and runtime timeout reproduction (arm64) |

### Other runtimes

1. Modify values in a `template.yaml` to suit your needs.
2. Modify `samconfig.toml` with your values.
3. Run the deploy script for that runtime.

## Testing Steps

Once deployed successfully the test cases can be invoked using the aws cli:

### Node.js

#### dt-incoming

Invoke with a synthetic API Gateway v2 payload that carries all three DT headers (`traceparent`, `tracestate`, `newrelic`). The `newrelic` header is the base64-encoded DT payload; its `tr` field and the `traceparent` trace ID are intentionally set to the same value so you can verify end-to-end linkage in the logs.

```bash
aws lambda invoke \
  --cli-binary-format raw-in-base64-out \
  --payload file://src/dt-incoming/event.json \
  --function-name kmullaney-sam-dt-incoming-nodejs22x \
  /dev/stdout
```

In CloudWatch, confirm:
1. **Step 1** log shows the full event with headers present
2. **Step 2** log shows `traceparent: 00-aabbccddeeff00112233445566778899-...`
3. **Step 3** log shows `Accepted distributed trace headers`
4. **Step 4** log shows `traceId: aabbccddeeff00112233445566778899` — matching the upstream

To test the **no-header** path (confirm the WARN fires), invoke without headers:

```bash
aws lambda invoke --function-name kmullaney-sam-dt-incoming-nodejs22x /dev/stdout
```

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
