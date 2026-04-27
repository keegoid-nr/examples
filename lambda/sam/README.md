# SAM CLI

Testing SAM CLI deployments with New Relic instrumentation

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Deployment Steps](#deployment-steps)
  - [Node.js](#nodejs)
  - [Other runtimes](#other-runtimes)
- [Testing Steps](#testing-steps)
  - [Node.js](#nodejs-1)
    - [dt-incoming](#dt-incoming)
  - [Ruby](#ruby)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

   Example:

   ```bash
   ./deploy.sh us-west-2 esm
   ```

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
