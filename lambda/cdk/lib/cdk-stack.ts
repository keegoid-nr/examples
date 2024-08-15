import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"

export class KmullaneyCdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Global variables
    const awsRegion = this.region
    const awsAccountId = this.account
    const licenseKeySecretName = "KMULLANEY_LICENSE_KEY" // Replace with your secret name

    // Fetch the New Relic account ID from the local environment variable
    const newRelicAccountId = process.env.NEW_RELIC_ACCOUNT_ID;
    if (!newRelicAccountId) {
      throw new Error("Environment variable NEW_RELIC_ACCOUNT_ID is not set");
    }

    // Fetch the New Relic account ID from the local environment variable
    const newRelicTrustedAccountKey = process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY;
    if (!newRelicTrustedAccountKey) {
      throw new Error("Environment variable NEW_RELIC_TRUSTED_ACCOUNT_KEY is not set");
    }

    // ******************************************* NODEJS 20

    const nodejsAppName = "nodejs20x"

    // Define the New Relic layer ARN
    const newRelicNodejsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "NewRelicLambdaNodejsLayer",
      "arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS20X:32"
    )

    // Create a Node.js Lambda function
    const myNodejsFunction = new lambda.Function(this, nodejsAppName, {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("nodejs"),
      handler: "newrelic-lambda-wrapper.handler",
      layers: [newRelicNodejsLayer],
      environment: {
        // distributed tracing config
        NEW_RELIC_ACCOUNT_ID: newRelicAccountId,                       // New Relic account ID
        NEW_RELIC_TRUSTED_ACCOUNT_KEY: newRelicTrustedAccountKey,      // New Relic account ID or parent ID
        NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",                 // DT

        // agent config
        NEW_RELIC_APP_NAME: nodejsAppName,                             // Should be set but not used in the New Relic UI, entity names come from the AWS integration
        NEW_RELIC_LAMBDA_HANDLER: "function.handler",                  // This points to your original handler
        NEW_RELIC_NO_CONFIG_FILE: "true",                              // Agent uses environment variables in Lambda
        NEW_RELIC_NATIVE_METRICS_ENABLED: "false",                     // Reduce cold start duration by not collecting VM metrics
        NEW_RELIC_LOG_ENABLED: "true",                                 // Agent logs
        NEW_RELIC_LOG: "stdout",                                       // Agent log path
        NEW_RELIC_LOG_LEVEL: "info",                                   // Agent log level: fatal, error, warn, info, debug, or trace
        NEW_RELIC_USE_ESM: "false",                                    // ESM functions that use async/await and not callbacks

        // extension config
        // NEW_RELIC_LICENSE_KEY: ""                                     // New Relic ingest key, overrides Secrets Manager
        NEW_RELIC_LICENSE_KEY_SECRET: licenseKeySecretName,            // Secrets Manager secret name for the extension (can override with env var NEW_RELIC_LICENSE_KEY)
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED: "true",                    // Enable/disable extension
        NEW_RELIC_DATA_COLLECTION_TIMEOUT: "1s",                       // Reduce timeout duration when for "Telemetry client error"
        NEW_RELIC_EXTENSION_LOGS_ENABLED: "true",                      // Enable/disable NR_EXT log lines
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS: "true",                // Send function logs
        NEW_RELIC_EXTENSION_LOG_LEVEL: "DEBUG"                         // INFO or DEBUG
      },
    })

    // Set log retention policy to 3 days
    new logs.LogGroup(this, "MyNodejsFunctionLogGroup", {
      logGroupName: `/aws/lambda/${myNodejsFunction.functionName}`,
      retention: logs.RetentionDays.THREE_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: to clean up log group on stack deletion
    })

    // Attach necessary IAM policies to the Lambda function
    myNodejsFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["logs:*"],
        resources: ["*"],
      })
    )

    // Attach policy to access the secret
    myNodejsFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [
          `arn:aws:secretsmanager:${awsRegion}:${awsAccountId}:secret:${licenseKeySecretName}*`,
        ],
      })
    )

    // Add tags to the Lambda function
    cdk.Tags.of(myNodejsFunction).add("owner", "kmullaney");
    cdk.Tags.of(myNodejsFunction).add("reason", "example");
    cdk.Tags.of(myNodejsFunction).add("description", "CDK Node.js example");

    // ******************************************* PYTHON 3.12

    const pythonAppName = "python312"

    // Define the New Relic layer ARN
    const newRelicPythonLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "NewRelicLambdaPythonLayer",
      "arn:aws:lambda:us-west-2:451483290750:layer:NewRelicPython312:15"
    )

    // Create a Python Lambda function
    const myPythonFunction = new lambda.Function(this, pythonAppName, {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("python"),
      handler: "newrelic_lambda_wrapper.handler",
      layers: [newRelicPythonLayer],
      environment: {
        // distributed tracing config
        NEW_RELIC_ACCOUNT_ID: newRelicAccountId,                       // New Relic account ID
        NEW_RELIC_TRUSTED_ACCOUNT_KEY: newRelicTrustedAccountKey,      // New Relic account ID or parent ID
        NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",                 // DT

        // agent config
        NEW_RELIC_APP_NAME: pythonAppName,                          // Should be set but not used in the New Relic UI, entity names come from the AWS integration
        NEW_RELIC_LAMBDA_HANDLER: "function.handler",                  // This points to your original handler
        NEW_RELIC_NO_CONFIG_FILE: "true",                              // Agent uses environment variables in Lambda
        NEW_RELIC_PACKAGE_REPORTING_ENABLED: "false",                  // disable Python agent package reporting feature to improve cold start times
        NEW_RELIC_LOG: "stderr",                                       // Agent log path
        NEW_RELIC_LOG_LEVEL: "info",                                   // Agent log level: fatal, error, warn, info, debug, or trace

        // extension config
        // NEW_RELIC_LICENSE_KEY: ""                                     // New Relic ingest key, overrides Secrets Manager
        NEW_RELIC_LICENSE_KEY_SECRET: licenseKeySecretName,            // Secrets Manager secret name for the extension (can override with env var NEW_RELIC_LICENSE_KEY)
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED: "true",                    // Enable/disable extension
        NEW_RELIC_DATA_COLLECTION_TIMEOUT: "1s",                       // Reduce timeout duration when for "Telemetry client error"
        NEW_RELIC_EXTENSION_LOGS_ENABLED: "true",                      // Enable/disable NR_EXT log lines
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS: "true",                // Send function logs
        NEW_RELIC_EXTENSION_LOG_LEVEL: "DEBUG"                         // INFO or DEBUG
      },
    })

    // Set log retention policy to 3 days
    new logs.LogGroup(this, "MyPythonFunctionLogGroup", {
      logGroupName: `/aws/lambda/${myPythonFunction.functionName}`,
      retention: logs.RetentionDays.THREE_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: to clean up log group on stack deletion
    })

    // Attach necessary IAM policies to the Lambda function
    myPythonFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["logs:*"],
        resources: ["*"],
      })
    )

    // Attach policy to access the secret
    myPythonFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [
          `arn:aws:secretsmanager:${awsRegion}:${awsAccountId}:secret:${licenseKeySecretName}*`,
        ],
      })
    )

    // Add tags to the Lambda function
    cdk.Tags.of(myPythonFunction).add("owner", "kmullaney");
    cdk.Tags.of(myPythonFunction).add("reason", "example");
    cdk.Tags.of(myPythonFunction).add("description", "CDK Python example");
  }
}

