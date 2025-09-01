<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [New Relic APM + Serverless Convergence: Python Demo Project](#new-relic-apm--serverless-convergence-python-demo-project)
  - [Feature Overview](#feature-overview)
  - [Requirements](#requirements)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Deployment Steps](#deployment-steps)
    - [Step 1: Make the Script Executable](#step-1-make-the-script-executable)
    - [Step 2: Run the Deployment Script](#step-2-run-the-deployment-script)
  - [Verification](#verification)
    - [Step 1: Invoke the Lambda Function](#step-1-invoke-the-lambda-function)
    - [Step 2: Find Your Function and Attributes in New Relic](#step-2-find-your-function-and-attributes-in-new-relic)
  - [Clean Up](#clean-up)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# New Relic APM + Serverless Convergence: Python Demo Project

This project provides a hands-on demonstration of the new **APM + Serverless Convergence** feature. It deploys a simple Python Lambda function configured to send its telemetry directly to New Relic APM, allowing you to explore the unified experience.

This guide is intended for New Relic Technical Support Engineers (TSEs) to quickly deploy and showcase this feature.

## Feature Overview

APM + Serverless Convergence unifies the monitoring of serverless functions and traditional services within New Relic APM. This demo uses the **wrapper method**, which requires no code changes to your function's core logic for instrumentation to work.

The key configuration steps are:

1. Setting the function's handler in AWS to `newrelic_lambda_wrapper.handler`.
2. Setting the `NEW_RELIC_LAMBDA_HANDLER` environment variable to your function's handler (e.g., `app.lambda_handler`).
3. Setting the `NEW_RELIC_APM_LAMBDA_MODE` environment variable to `true`.
4. Adding the `NR.Apm.Lambda.Mode: true` AWS tag to the function.

Once enabled, the Lambda function will appear as a service entity in the **APM & Services** UI, just like any other APM-instrumented application.

## Requirements

You must use a [New Relic Lambda layer](https://layers.newrelic-external.com/) that includes [Extension 2.3.24](https://github.com/newrelic/newrelic-lambda-extension/releases/tag/v2.3.24) or greater which adds support for `NR_TAGS` and the AWS Secrets Manager for APM Mode.

*`NR_TAGS` is needed if not using a cloud integration. It is another way to attach the `NR.Apm.Lambda.Mode: true` tag to the APM entity.*

## Prerequisites

Before you begin, ensure you have the following installed and configured:

1. **AWS CLI**: Configured with credentials for an AWS account. ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html))
2. **AWS SAM CLI**: The Serverless Application Model CLI is used for deployment. ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html))
3. **Docker**: The build process uses a container, so Docker must be running.
4. **New Relic Account ID**: Your New Relic Account ID.
5. **New Relic Trusted Account Key**: For distributed tracing, this is your New Relic parent account ID. If you don't have a parent account, use your New Relic Account ID.
6. **AWS Secrets Manager Secret**: You must store your New Relic Ingest License Key in AWS Secrets Manager.

    **For this Demo (TSEs on a Shared AWS Account):**
    Because we use a shared AWS account for this demo, you **must** create a secret with a unique name to avoid conflicts.

    1. Navigate to the AWS Secrets Manager console.
    2. Click "Store a new secret".
    3. Select "Other type of secret".
    4. Under "Secret key/value", create one key-value pair:
        * **Key:** `LicenseKey`
        * **Value:** Paste your ingest license key.
    5. Give the secret a **unique name** (e.g., `your-name-nr-license-key`). This is the **Secret Name** you will provide during deployment.

    **How it Works for Customers:**
    By default, the New Relic Lambda Extension automatically looks for a secret named exactly `NEW_RELIC_LICENSE_KEY`. If a customer uses this standard name, they do **not** need to set the `NEW_RELIC_LICENSE_KEY_SECRET` environment variable.

    Since our demo requires a unique secret name, the `template.yaml` uses the `LicenseKeyName` parameter you provide to set the `NEW_RELIC_LICENSE_KEY_SECRET` environment variable. This explicitly tells the extension which uniquely-named secret to use.

    Additionally, setting the `NEW_RELIC_LICENSE_KEY` environment variable directly (e.g., in the `template.yaml`) will always override any value fetched from Secrets Manager. This provides a direct way to set the key for testing or specific use cases.

## Project Structure

```sh
.
├── README.md
├── deploy.sh       <-- The deployment script
├── src
│   │── app.py      <-- Your Lambda function code
│   └── event.json  <-- Example test event payload
└── template.yaml   <-- The SAM template
```

## Deployment Steps

The included `deploy.sh` script automates the entire build and deployment process. It will create a unique S3 bucket for the deployment assets based on your username and the project directory.

### Step 1: Make the Script Executable

From your terminal, run the following command to make the deployment script executable:

```sh
chmod +x deploy.sh
```

### Step 2: Run the Deployment Script

Execute the script and provide the AWS region you want to deploy to as an argument.

```sh
./deploy.sh us-west-2
```

The script will start the SAM deployment process. SAM will prompt you to enter the required parameters. The template now includes default values for the US production endpoints.

**For a standard US Production deployment, you only need to enter your account-specific information.**

**For a Staging deployment, you must override the default endpoint values with the staging URLs.**

**Example SAM Prompt:**

```sh
Parameters
==========

NewRelicTelemetryEndpoint [https://cloud-collector.newrelic.com/aws/lambda/v1]:
NewRelicMetricEndpoint [https://metric-api.newrelic.com/metric/v1]:
NewRelicLogEndpoint [https://log-api.newrelic.com/log/v1]:
NewRelicHost [collector.newrelic.com]:
LicenseKeyName []: NAME_OF_YOUR_AWS_SECRET
NewRelicTrustedAccountKey []: YOUR_NR_TRUSTED_ACCOUNT_KEY
NewRelicAccountId []: YOUR_NR_ACCOUNT_ID
```

**Note:** You can skip the `NewRelicTelemetryEndpoint` parameter. As noted in `template.yaml`, this endpoint is not used when the function is in APM mode.

After you've entered the parameters, SAM will create the CloudFormation stack and deploy your resources.

## Verification

### Step 1: Invoke the Lambda Function

Invoke the function a few times to generate telemetry data. The function name is hardcoded as `Kmullaney-APM-Demo-Function` in the `template.yaml`.

```sh
aws lambda invoke --function-name Kmullaney-APM-Demo-Function response.json
```

To test with a specific payload, create a file named `payload.json` with the following content:

```sh
{
  "userId": "user-demo-555",
  "cartValue": 310.45
}
```

Then invoke the function with this payload:

```sh
aws lambda invoke --function-name Kmullaney-APM-Demo-Function --payload file://payload.json response.json
```

(Repeat invocations 5-10 times to ensure data is sent.)

### Step 2: Find Your Function and Attributes in New Relic

1. Navigate to **one.newrelic.com > APM & Services**.
2. It may take 1-3 minutes for the new entity to appear.
3. To easily find APM-enabled Lambda functions, use the filter bar to search for the tag: `isLambdaFunction = true`.
4. You should see your service named **Kmullaney-APM-Lambda-Demo**.
5. Click on the service, then go to **Distributed tracing** in the left-hand menu.
6. Select a recent trace. In the trace details view, click on the span for your Lambda function.
7. In the span attributes panel on the right, you will find the custom attributes you added, such as `userId`, `cartValue`, and `userTier`.

This demonstrates how you can enrich your telemetry with business-specific data without modifying your core function logic for instrumentation.

## Clean Up

To avoid ongoing AWS charges, you should delete the resources you created. The `deploy.sh` script creates a CloudFormation stack with a unique name. You can find this name in the output of the script or by navigating to the CloudFormation console in AWS.

Replace `<stack-name>` in the command below with the name of the stack created by the script (e.g., `your-user-nr-apm-lambda-demo-us-west-2`).

```sh
aws cloudformation delete-stack --stack-name <stack-name>
```
