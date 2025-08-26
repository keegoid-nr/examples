# .NET Lambda with New Relic and Dedicated HTTP Proxy

This project demonstrates how to deploy a .NET 8 Lambda function that is instrumented with New Relic, runs within a private VPC subnet, and routes all its outbound traffic through a dedicated HTTP proxy server running on an EC2 instance.

This setup is common in enterprise environments where outbound traffic must be inspected, logged, or controlled by a central proxy.

## Project Structure

* `template.yaml`: The AWS SAM template that defines all AWS resources, including the VPC, EC2 proxy, and the Lambda function.
* `src/HttpProxy/`: The directory containing the .NET Lambda project.
  * `Function.cs`: The main Lambda handler code.
  * `HttpProxy.csproj`: The .NET project file.

## Before You Deploy

1. **Install AWS SAM CLI**: If you haven't already, [install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
2. **Install .NET 8**: Ensure you have the [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) installed.
3. **Configure AWS Credentials**: Set up your AWS credentials for the SAM CLI to use.
4. **Prerequisites**:
   * An **AWS EC2 Key Pair** must exist in the region where you are deploying.
   * A **New Relic Ingest License Key** must be stored in AWS Secrets Manager.

## How to Deploy

1. **Build the SAM Application**:
   From the project's root directory, run the build command:

    ```bash
    sam build
    ```

2. **Deploy to AWS**:
   Deploy the application using the guided deployment command:

    ```bash
    sam deploy --guided
    ```

The SAM CLI will prompt you for the required parameters (`NRAccountId`, `NRTrustedAccountKey`, `LicenseKeyName`, `KeyPair`, and `DevAccount`). The deployment will take a few minutes as it needs to create a VPC and an EC2 instance.

### How it Works

* **VPC and Networking**: The template creates a VPC with a **public subnet** (for resources that need direct internet access) and a **private subnet** (for isolated resources).
* **HTTP Proxy Server**: An EC2 instance is launched into the public subnet. A `UserData` script automatically installs and runs `tinyproxy`, a lightweight HTTP proxy service. This proxy can reach the internet via the VPC's Internet Gateway.
* **Lambda Function**: The Lambda function is deployed into the **private subnet**. It has no direct route to the internet. Its security group is configured to only allow outbound traffic to the proxy server on the designated port (8888).
* **Proxy Configuration**:
* The **New Relic Lambda Extension** is configured via the `NEW_RELIC_PROXY_HOST` and `NEW_RELIC_PROXY_PORT` environment variables to send all its telemetry data through our EC2 proxy.
* The **.NET application code** (`HttpClient`) is configured via the standard `HTTPS_PROXY` environment variable to send its requests to the same proxy.
* **Demonstration**: The function's code calls `https://api.ipify.org`. This request is sent to the proxy, which forwards it to the internet. The response contains the **public IP of the EC2 proxy instance**, proving that all application traffic is being correctly routed.

### How to Test and Verify

You can verify that the New Relic Lambda Extension is correctly using the proxy by examining the function's logs in Amazon CloudWatch.

#### 1. Successful Proxy Connection

When the `NEW_RELIC_PROXY_HOST` and `NEW_RELIC_PROXY_PORT` environment variables are correctly set, you will see log entries from the extension (`[NR_EXT]`) indicating that data was sent successfully.

```log
2025-08-26T02:21:09.707Z [NR_EXT] attemptSend: data sent to New Relic succesfully
2025-08-26T02:21:09.707Z [NR_EXT] sendPayloads: took 45.35846ms to finish sending all payloads
2025-08-26T02:21:09.707Z [NR_EXT] Sent 1/1 New Relic function log batches successfully with certainty in 45.697ms (45ms to transmit 0.4kB).
```

#### 2. Failed Proxy Connection (Test Case)

To test the failure scenario, you can temporarily clear the `NEW_RELIC_PROXY_HOST` and `NEW_RELIC_PROXY_PORT` environment variables in the Lambda function's configuration. Since the function is in a private subnet with no other route to the internet, the extension will fail to connect. You will see a "Telemetry client error" in the logs.

```log
2025-08-26T02:23:01.566Z [NR_EXT] Telemetry client error: Post "https://log-api.newrelic.com/log/v1": proxyconnect tcp: dial tcp: lookup http on 169.254.100.5:53: no such host, payload size: 523 bytes
2025-08-26T02:23:01.566Z [NR_EXT] sendPayloads: took 17.38622ms to finish sending all payloads
2025-08-26T02:23:01.567Z [NR_EXT] Sent 0/1 New Relic function log batches successfully with certainty in 18.014ms (17ms to transmit 0.0kB).
```

This confirms that without the proxy, the extension cannot send data, proving the proxy is essential for communication.
