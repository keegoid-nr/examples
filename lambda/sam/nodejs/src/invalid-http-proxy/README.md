# Reproduction: New Relic Lambda Extension Proxy Timeout

## Issue Description

This repository contains a reproducible test case demonstrating an issue where the New Relic Lambda Extension times out and fails to send telemetry data to the New Relic collector endpoint.

While routing outbound traffic works correctly when using the standard global HTTPS\_PROXY environment variable, configuring the New Relic-specific **NEW\_RELIC\_LAMBDA\_EXTENSION\_PROXY** to an invalid or unreachable proxy endpoint causes the extension's HTTP client to hang. Because the extension fails to bypass or recover from this invalid configuration within the Lambda's lifecycle, the connection attempts block the execution loop, leading to Lambda timeouts and dropped telemetry payloads.

## Architecture & Configuration

The reproduction architecture relies on the following infrastructure and configuration:

* **VPC (10.0.0.0/16)**: Deployed with both public and private subnets.
* **Outbound Path**: An Internet Gateway on the public subnet and a NAT Gateway to allow outbound internet access for resources in the private subnet.
* **Secrets Manager VPC Endpoint**: An interface endpoint to securely fetch the New Relic license key within the VPC.
* **Lambda Function**: A Node.js 24.x (arm64) function using the standard New Relic layer wrapper (arn:aws:lambda:ca-central-1:451483290750:layer:NewRelicNodeJSARM64:25).
  * Deployed inside the VPC private subnet.
  * Configured with an unreachable/invalid extension proxy: NEW\_RELIC\_LAMBDA\_EXTENSION\_PROXY: http://10.0.1.5.

### SAM Environment Variables Setup

Below are the environment variables configured in the SAM template that produce this failure:

```yaml
Environment:
  Variables:
    NEW_RELIC_EXTENSION_LOG_LEVEL: ALL
    NEW_RELIC_LAMBDA_EXTENSION_PROXY: http://10.0.1.5 # <--- The invalid proxy causing the timeout
    NEW_RELIC_ACCOUNT_ID: '123456'
    NEW_RELIC_EXTENSION_LOGS_ENABLED: 'true'
    NEW_RELIC_LICENSE_KEY_SECRET: LICENSE_KEY_SECRET
    NEW_RELIC_TRUSTED_ACCOUNT_KEY: '123456'
    NEW_RELIC_DISTRIBUTED_TRACING_EXCLUDE_NEWRELIC_HEADER: 'true'
    NEW_RELIC_LAMBDA_HANDLER: index.handler
```

## Reproduction Steps

1. **Prerequisites**:
   * AWS CLI and AWS SAM CLI installed.
   * A valid New Relic License Key stored in AWS Secrets Manager (LICENSE\_KEY\_SECRET).
1. **Deploy the Application**: Using the provided SAM template, deploy the function to your AWS account:
   `sam deploy --guided`
1. **Invoke the Lambda Function**: Trigger the function multiple times to generate telemetry and allow the extension to batch payloads.
   `aws lambda invoke --function-name kmullaney-sam-vpc-nodejs24x-arm64 response.json`
1. **Observe CloudWatch Logs**: Examine the logs to witness the extension registering the proxy and subsequently timing out.

## Log Analysis

The logs provided in collector-timeout-invalid-proxy.csv map out the timeline of this networking failure.

### 1. Proxy Recognition**

At cold start, the extension successfully grabs the license key from Secrets Manager and then registers the proxy configured via NEW\_RELIC\_LAMBDA\_EXTENSION\_PROXY:

```log
[NR_EXT] INFO Proxy enabled: http://10.0.1.5
...
[NR_EXT] INFO Proxy configured for New Relic client
...
[NR_EXT] INFO Proxy configured for APM client
```

### 2. Local Telemetry Buffering

The Lambda starts running invocations normally, and the local extension buffers the payloads successfully:

```log
[NR_EXT] DEBUG Stored agent payload in request buffer for 9f2b0992-45fc-4628-88dc-05e860093248
[NR_EXT] DEBUG Batch threshold reached: 3 agent payloads with report lines
[NR_EXT] DEBUG Sending agent payload to NR: 6012 bytes
```

### 3. Request Timeout & Retries

When trying to flush the batch to https://cloud-collector.newrelic.com/aws/lambda/v1, the extension attempts to route through the invalid proxy http://10.0.1.5. This results in connection timeouts and retry exhaustion:

```log
[NR_EXT] WARN [agentsend] Request timeout after 2.4s (will retry): error sending request for url (https://cloud-collector.newrelic.com/aws/lambda/v1)
[NR_EXT] WARN [agentsend] Max network retries exceeded
[NR_EXT] WARN Failed to send batched payloads with reports after all retries: error sending request for url (https://cloud-collector.newrelic.com/aws/lambda/v1) - Keeping 3 payloads in buffer for next attempt
```

### 4. Lambda Timeout / Extension Shutdown** Because the network calls block the runtime, the Lambda function hits its hard execution limit (10 seconds) during the 4th invocation. The extension receives a shutdown event and synthesizes a timeout error:

```log
[NR_EXT] INFO Serverless mode: Extension shutting down with reason: timeout
[NR_EXT] DEBUG Shutdown due to timeout - synthesizing timeout error for request: c9197091-f548-43f2-9044-0b6a17ac8275
REPORT RequestId: c9197091-f548-43f2-9044-0b6a17ac8275 Duration: 10000.00 ms Billed Duration: 10000 ms Status: timeout
```

## Conclusion & Fix

The reproduction proves that configuring NEW\_RELIC\_LAMBDA\_EXTENSION\_PROXY overrides standard routing, and if misconfigured, silently swallows outbound telemetry and blocks the Lambda runtime.
To resolve this issue:

* **Remove** NEW\_RELIC\_LAMBDA\_EXTENSION\_PROXY from the Lambda's environment variables to allow natural outbound routing via your VPC's NAT Gateway.
* Alternatively, if a proxy is strictly required, ensure the proxy host address (e.g., http://10.0.1.5) is online, reachable from the private subnets, and accepting traffic on the designated port.
