# New Relic .NET Lambda `NoticeError` Bug Reproduction

This project contains two AWS .NET 8 Lambda functions deployed using AWS SAM, designed to reproduce a potential bug in the New Relic .NET agent where the payload for `NoticeError` differs and may be dropped during backend processing depending on whether an `Exception` object or an exception string is provided to the function.

The two Lambda functions demonstrate the following scenarios:

* **`ObjectError`**: Calls `NewRelic.Api.Agent.NewRelic.NoticeError` with an `Exception` object.
* **`StringError`**: Calls `NewRelic.Api.Agent.NewRelic.NoticeError` with an exception string (`Exception.Message`).

By deploying and invoking these functions, you can observe how the error data is reported (or not reported) in your New Relic account, highlighting the potential discrepancy.

## Project Structure

```
.
├── lambda
│   └── sam
│       └── dotnet
│           ├── deploy.sh
│           ├── template.yaml
│           ├── ObjectError
│           │   └── Function.cs
│           └── StringError
│               └── Function.cs
```

## Prerequisites

* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured with appropriate credentials
* An AWS account
* A New Relic account
* A New Relic License Key stored in AWS Secrets Manager. The name of this secret will be provided as a parameter during deployment.

## Deployment

1. Navigate to the `lambda/sam/dotnet` directory in your terminal.
2. Execute the `deploy.sh` script, providing your desired AWS region as an argument:

    ```bash
    ./deploy.sh <your-aws-region>
    ```

    The script will:
    * Create an S3 bucket for deployment artifacts if one does not exist.
    * Build the Lambda functions using SAM.
    * Package the functions and upload them to the S3 bucket.
    * Deploy the SAM template to CloudFormation, creating the Lambda functions, IAM role, and API Gateway endpoints.

3. During the deployment process, you will be prompted to provide the following CloudFormation parameters:
    * `NRAccountId`: Your New Relic account ID.
    * `NRTrustedAccountKey`: Your New Relic parent account ID or account ID if no parent.
    * `LicenseKeyName`: The name of your AWS Secrets Manager secret containing your New Relic ingest license key.

4. Upon successful deployment, the SAM CLI will output the API Gateway endpoints for each Lambda function. Note these endpoints.

## Invoking the Functions

You can invoke the deployed Lambda functions using a tool like `curl` or a web browser.

* **To trigger the `ObjectError` function:**

    ```bash
    curl <ObjectError-API-Gateway-Endpoint>/object/error
    ```

* **To trigger the `StringError` function:**

    ```bash
    curl <StringError-API-Gateway-Endpoint>/string/error
    ```

Each successful invocation should return a JSON body similar to:

```json
{"message":"hello world","location":"<calling-ip-address>"}
```

While the HTTP response indicates success, the purpose of this test is to observe the error reporting behavior in New Relic.

## Observing Results in New Relic

After invoking the functions, navigate to your New Relic account.

* **Check for errors:** Look for reported errors associated with your Lambda functions.
* **Compare error details:** Examine the details of any reported errors from the `ObjectError` and `StringError` functions.

Based on the reported bug, you may observe that the error from the `StringError` function (using `NoticeError` with a string) is either missing or has different attributes compared to the error from the `ObjectError` function (using `NoticeError` with an `Exception` object). This would indicate the payload formatting difference and subsequent backend processing issue.

## Cleaning Up

To remove the deployed AWS resources, navigate back to the `lambda/sam/dotnet` directory and use the AWS CLI to delete the CloudFormation stack created by the `deploy.sh` script. The stack name will be based on your username, the directory name, and the region (e.g., `yourusername-dotnet-<region>`).

```bash
aws cloudformation delete-stack --stack-name <your-stack-name> --region <your-aws-region>
```

You may also want to remove the S3 bucket created by the script if it's no longer needed.

```bash
aws s3 rb s3://<your-bucket-name> --force --region <your-aws-region>
```
