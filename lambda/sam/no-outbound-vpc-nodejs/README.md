<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [no-outbound-vpc](#no-outbound-vpc)
  - [Setup with Extension Enabled NodeJS18X Layer](#setup-with-extension-enabled-nodejs18x-layer)
    - [Layer](#layer)
    - [Environment variables](#environment-variables)
    - [VPC](#vpc)
    - [With Outbound Rule in Security Group](#with-outbound-rule-in-security-group)
      - [1. NO NR LAYER](#1-no-nr-layer)
      - [2. WITH NR LAYER](#2-with-nr-layer)
    - [Without Outbound Rule in Security Group](#without-outbound-rule-in-security-group)
      - [1. NO NR LAYER](#1-no-nr-layer-1)
      - [2. WITH NR LAYER](#2-with-nr-layer-1)
  - [Setup with Extension Disabled NodeJS18X Layer](#setup-with-extension-disabled-nodejs18x-layer)
    - [Layer](#layer-1)
    - [Environment Variables](#environment-variables-1)
    - [NR Layer With Outbound Rule in Security Group](#nr-layer-with-outbound-rule-in-security-group)
    - [NR Layer Without Outbound Rule in Security Group](#nr-layer-without-outbound-rule-in-security-group)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# no-outbound-vpc

Reproduction for https://github.com/newrelic/newrelic-lambda-layers/issues/202

## Setup with Extension Enabled NodeJS18X Layer

I used the SAM deployment, which works similarly to the Serverless Framework but removes the serverless-newrelic-lambda-layers plugin from the equation.

Create a `samconfig.toml` for parameter overrides:

```toml
version = 0.1

[default.deploy.parameters]
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "NRAccountId=1234567 NRTrustedAccountKey=1234567 SecurityGroupIds=sg-15e44bc2831259619 SubnetIds=subnet-ffe5fb9254e5533e9,subnet-b38b3e8d28805c14a"
```

### Layer

```sh
arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS18X:58
```

### Environment variables

```yaml
NEW_RELIC_ACCOUNT_ID 1234567
NEW_RELIC_EXTENSION_LOGS_ENABLED true
NEW_RELIC_EXTENSION_LOG_LEVEL DEBUG
NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS true
NEW_RELIC_DATA_COLLECTION_TIMEOUT 1s
NEW_RELIC_LAMBDA_HANDLER function.handler
NEW_RELIC_LOG stdout
NEW_RELIC_LOG_ENABLED true
NEW_RELIC_LOG_LEVEL trace
```

### VPC

Add function to a VPC. I've connected two private subnets to a NAT Gateway, which is connected to two public subnets and an Internet Gateway.

### With Outbound Rule in Security Group

#### 1. NO NR LAYER

```log
| 2024-02-02 21:05:08.976 | INIT_START Runtime Version: nodejs:18.v20 Runtime Version ARN: arn:aws:lambda:us-west-2::runtime:a993d90ea43647b82f490a45d7ddd96b557b916a30128d9dcab5f4972911ec0f |
| 2024-02-02 21:05:09.114 | 2024-02-02T21:05:09.114Z undefined INFO Lambda Handler starting up |
| 2024-02-02 21:05:09.119 | START RequestId: 83102360-9799-4ba5-923a-7b677143228d Version: $LATEST |
| 2024-02-02 21:05:09.120 | 2024-02-02T21:05:09.120Z 83102360-9799-4ba5-923a-7b677143228d INFO Hello world! |
| 2024-02-02 21:05:09.123 | END RequestId: 83102360-9799-4ba5-923a-7b677143228d |
| 2024-02-02 21:05:09.123 | REPORT RequestId: 83102360-9799-4ba5-923a-7b677143228d Duration: 2.41 ms Billed Duration: 3 ms Memory Size: 1024 MB Max Memory Used: 66 MB Init Duration: 141.87 ms |
```

#### 2. WITH NR LAYER

To test outbound VPC with layer, I performed 1 cold start and 1 warm invocation. See [with-outbound-vpc-nr-ext-enabled.log](./log-results/with-outbound-vpc-nr-ext-enabled.log)

As an additional test to reproduce the `Telemetry client error` common to the extension, I initiated 1 cold start and several warm invocations. Of note but not related to the VPC issue, the extension tried to send for 10s in between invocations and failed.

```log
| 2024-02-02 18:03:32.858 | REPORT RequestId: 4cb4ccfd-2856-411e-87f7-58a2a40ec212 Duration: 183.06 ms Billed Duration: 184 ms Memory Size: 1024 MB Max Memory Used: 114 MB Init Duration: 609.16 ms |

| 2024-02-02 18:03:45.236 | [NR_EXT] Telemetry client error: failed to send data within user defined timeout period: 10s |
| 2024-02-02 18:03:45.236 | [NR_EXT] sendPayloads: took 12.43739277s to finish sending all payloads |
| 2024-02-02 18:03:45.236 | [NR_EXT] Sent 0/1 New Relic function log batches successfully with certainty in 12440.432ms (12437ms to transmit 0.0kB). |
| 2024-02-02 18:03:45.236 | [NR_EXT] attemptSend: timeout error, retrying after 200.000114ms: Post "https://log-api.newrelic.com/log/v1": context deadline exceeded (Client.Timeout exceeded while awaiting headers) |

| 2024-02-02 18:03:45.237 | START RequestId: c390c8be-123e-47cf-bcc3-3f4b9046f55e Version: $LATEST |
```

It succeeded later, and didn't impact the duration of the warm invocation which actually took 118 ms.

```log
| 2024-02-02 18:03:45.279 | [NR_EXT] Aggressive harvest yielded 1 invocations |
| 2024-02-02 18:03:45.279 | [NR_EXT] shipHarvest: harvesting agent telemetry |
| 2024-02-02 18:03:45.279 | [NR_EXT] shipHarveset: 1 telemetry payloads harvested |
| 2024-02-02 18:03:45.279 | [NR_EXT] SendTelemetry: sending telemetry to New Relic... |
| 2024-02-02 18:03:45.279 | [NR_EXT] SendTelemetry: compressing telemetry payloads... |
| 2024-02-02 18:03:45.354 | [NR_EXT] attemptSend: data sent to New Relic succesfully |
| 2024-02-02 18:03:45.354 | [NR_EXT] sendPayloads: took 74.274729ms to finish sending all payloads |
| 2024-02-02 18:03:45.354 | [NR_EXT] Sent 1/1 New Relic payload batches with 1 log events successfully with certainty in 75.059ms (74ms to transmit 1.3kB). |
| 2024-02-02 18:03:45.355 | REPORT RequestId: c390c8be-123e-47cf-bcc3-3f4b9046f55e Duration: 117.73 ms Billed Duration: 118 ms Memory Size: 1024 MB Max Memory Used: 114 MB |
```

This appears to happen pretty often but doesn't impact billed durations. The send appears to run asynchronously in the runtime environment. When we see the `Telemetry client error: failed to send data within user defined timeout period: 10s`, it indicates that all retries have failed and we dropped that payload. Since it doesn't appear to ever recover, it's a good idea to set a 1 second timeout instead of 10 seconds in order to fail faster. It should be able to retry at least 5 times (200 ms each) within 1 second.

- See [with-outbound-vpc-nr-ext-10s-timeout.log](./log-results/with-outbound-vpc-nr-ext-10s-timeout.log) for 10 second timeouts.
- See [with-outbound-vpc-nr-ext-1s-timeout.log](./log-results/with-outbound-vpc-nr-ext-1s-timeout.log) for 1 second timeouts.

### Without Outbound Rule in Security Group

#### 1. NO NR LAYER

Without connectivity, no errors are reported. I initiated 1 cold start and it produced 1 cold start.

```log
| 2024-02-02 20:44:52.639 | INIT_START Runtime Version: nodejs:18.v20 Runtime Version ARN: arn:aws:lambda:us-west-2::runtime:a993d90ea43647b82f490a45d7ddd96b557b916a30128d9dcab5f4972911ec0f |
| 2024-02-02 20:44:52.804 | 2024-02-02T20:44:52.804Z undefined INFO Lambda Handler starting up |
| 2024-02-02 20:44:52.808 | START RequestId: 18e67f9e-b345-4285-a9bf-ded8fb18bd7a Version: $LATEST |
| 2024-02-02 20:44:52.809 | 2024-02-02T20:44:52.809Z 18e67f9e-b345-4285-a9bf-ded8fb18bd7a INFO Hello world! |
| 2024-02-02 20:44:52.811 | END RequestId: 18e67f9e-b345-4285-a9bf-ded8fb18bd7a |
| 2024-02-02 20:44:52.811 | REPORT RequestId: 18e67f9e-b345-4285-a9bf-ded8fb18bd7a Duration: 2.11 ms Billed Duration: 3 ms Memory Size: 1024 MB Max Memory Used: 66 MB Init Duration: 168.21 ms |
```

#### 2. WITH NR LAYER

See [no-outbound-vpc-nr-ext-enabled.log](./log-results/no-outbound-vpc-nr-ext-enabled.log) file.

Without connectivity, there were several serious errors and timeouts. I initiated 1 cold start and it produced 1 cold start plus 2 retries for a total of 3 cold starts.

This init stuff didn't happen:

```log
| [NR_EXT] Log registration with request  {"buffering":{"maxBytes":1048576,"maxItems":10000,"timeoutMs":500},"destination":{"URI":"http://sandbox:44273","protocol":"HTTP"},"types":["platform","function"]} |
| [NR_EXT] Starting log server. |
| LOGS Name: newrelic-lambda-extension State: Subscribed Types: [Platform, Function] |
| [NR_EXT] Registered for logs. Got response code  200 "OK" |
| [NR_EXT] mainLoop: blocking while awaiting next invocation event... |
| [NR_EXT] fetching 'NEW_RELIC_LICENSE_KEY' from SSM Parameter Store |
```

Node agent says it's connected to New Relic, but this isn't possible with no outbound access in the VPC.

```log
| 2024-02-02 20:10:47.558 | {"v":0,"level":20,"name":"newrelic","hostname":"169.254.63.45","pid":16,"time":"2024-02-02T20:10:47.558Z","msg":"New Relic for Node.js is connected to New Relic."} |
```

We see an error just after the start of the INVOKE, SHUTDOWN phase. The Lambda runtime reported a timeout after 10 seconds.

```log
| 2024-02-02 20:10:56.886 | EXTENSION Name: newrelic-lambda-extension State: Registered Events: [INVOKE, SHUTDOWN] |
| 2024-02-02 20:10:56.886 | INIT_REPORT Init Duration: 9999.58 ms Phase: init Status: timeout |
| 2024-02-02 20:10:56.887 | [ERROR] [1706904656887] LAMBDA_RUNTIME Failed to get next invocation. No Response from endpoint |
```

Then a retry of the cold start:

```log
| 2024-02-02 20:10:57.031 | [NR_EXT] New Relic Lambda Extension starting up |
```

Near the end of the 1st retry, an error is reported about `Runtime.Unknown`. It then starts a 2nd retry before the end of the 1st retry.

```log
| 2024-02-02 20:11:02.919 | EXTENSION Name: newrelic-lambda-extension State: Registered Events: [INVOKE, SHUTDOWN] |
| 2024-02-02 20:11:02.919 | INIT_REPORT Init Duration: 6006.37 ms Phase: invoke Status: error Error Type: Runtime.Unknown |
| 2024-02-02 20:11:02.919 | START RequestId: 21efd12b-4b6b-4795-8d1d-9f88de92b189 Version: $LATEST |
| 2024-02-02 20:11:04.921 | 2024-02-02T20:11:04.919Z 21efd12b-4b6b-4795-8d1d-9f88de92b189 Task timed out after 8.01 seconds |
| 2024-02-02 20:11:04.921 | END RequestId: 21efd12b-4b6b-4795-8d1d-9f88de92b189 |
| 2024-02-02 20:11:04.921 | REPORT RequestId: 21efd12b-4b6b-4795-8d1d-9f88de92b189 Duration: 8007.37 ms Billed Duration: 6000 ms Memory Size: 1024 MB Max Memory Used: 49 MB |
| 2024-02-02 20:11:04.954 | INIT_START Runtime Version: nodejs:18.v20 Runtime Version ARN: arn:aws:lambda:us-west-2::runtime:a993d90ea43647b82f490a45d7ddd96b557b916a30128d9dcab5f4972911ec0f |
| 2024-02-02 20:11:05.031 | [NR_EXT] New Relic Lambda Extension starting up |
```

Finally, it ends at the start of the 2nd retry INVOKE, SHUTDOWN phase and another 10 second timeout.

```log
| 2024-02-02 20:11:14.953 | EXTENSION Name: newrelic-lambda-extension State: Registered Events: [SHUTDOWN, INVOKE] |
| 2024-02-02 20:11:14.953 | INIT_REPORT Init Duration: 9999.72 ms Phase: init Status: timeout |
```

## Setup with Extension Disabled NodeJS18X Layer

Same as before except for environment variables.

### Layer

```sh
arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS18X:58
```

### Environment Variables

```sh
NEW_RELIC_ACCOUNT_ID 1234567
NEW_RELIC_LAMBDA_EXTENSION_ENABLED false
NEW_RELIC_LAMBDA_HANDLER function.handler
NEW_RELIC_LOG stdout
NEW_RELIC_LOG_ENABLED true
NEW_RELIC_LOG_LEVEL trace
```

### NR Layer With Outbound Rule in Security Group

I performed 1 cold start and 1 warm invocation. No errors or timeouts. See [with-outbound-vpc-nr-ext-disabled.log](./log-results/with-outbound-vpc-nr-ext-disabled.log).

### NR Layer Without Outbound Rule in Security Group

I performed 1 cold start and 1 warm invocation. No errors or timeouts. See [no-outbound-vpc-nr-ext-disabled.log](./log-results/no-outbound-vpc-nr-ext-disabled.log).

```log
| 2024-02-02 23:55:37.506 | INIT_START Runtime Version: nodejs:18.v20 Runtime Version ARN: arn:aws:lambda:us-west-2::runtime:a993d90ea43647b82f490a45d7ddd96b557b916a30128d9dcab5f4972911ec0f |
| 2024-02-02 23:55:37.582 | [NR_EXT] New Relic Lambda Extension starting up |
| 2024-02-02 23:55:37.584 | [NR_EXT] Extension telemetry processing disabled |
| 2024-02-02 23:55:37.584 | [NR_EXT] Starting no-op mode, no telemetry will be sent |
| 2024-02-02 23:55:38.019 | 2024-02-02T23:55:38.019Z undefined INFO Lambda Handler starting up |
| 2024-02-02 23:55:38.041 | {"v":0,"level":10,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:38.041Z","msg":"Peparing to harvest."} |
| 2024-02-02 23:55:38.041 | {"v":0,"level":30,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:38.041Z","msg":"Harvest started."} |
| 2024-02-02 23:55:38.045 | {"v":0,"level":30,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:38.045Z","msg":"Harvest finished."} |
| 2024-02-02 23:55:38.049 | END RequestId: 82992c55-e607-4ee4-8300-366f8d0f0bcd |
| 2024-02-02 23:55:38.049 | REPORT RequestId: 82992c55-e607-4ee4-8300-366f8d0f0bcd Duration: 20.30 ms Billed Duration: 21 ms Memory Size: 1024 MB Max Memory Used: 104 MB Init Duration: 519.89 ms |
| 2024-02-02 23:55:46.676 | START RequestId: ed7b6ea2-63f5-427d-9280-9acfd82ee1a9 Version: $LATEST |
| 2024-02-02 23:55:46.721 | {"v":0,"level":10,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:46.721Z","msg":"Peparing to harvest."} |
| 2024-02-02 23:55:46.721 | {"v":0,"level":30,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:46.721Z","msg":"Harvest started."} |
| 2024-02-02 23:55:46.723 | {"v":0,"level":30,"name":"newrelic","hostname":"169.254.29.105","pid":14,"time":"2024-02-02T23:55:46.723Z","msg":"Harvest finished."} |
| 2024-02-02 23:55:46.725 | END RequestId: ed7b6ea2-63f5-427d-9280-9acfd82ee1a9 |
| 2024-02-02 23:55:46.725 | REPORT RequestId: ed7b6ea2-63f5-427d-9280-9acfd82ee1a9 Duration: 48.34 ms Billed Duration: 49 ms Memory Size: 1024 MB Max Memory Used: 105 MB |
```
