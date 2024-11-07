import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"
import * as destinations from 'aws-cdk-lib/aws-logs-destinations';

export class KmullaneyCdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Global variables
    const awsRegion = this.region
    const awsAccountId = this.account
    const myMemory = 256
    const myTimeout = cdk.Duration.seconds(6)
    const licenseKeySecretName = "KMULLANEY_LICENSE_KEY" // Replace with your secret name
    const logIngestionFunctionName = "newrelic-log-ingestion-02aeffb53869"

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
      "arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS20X:42"
    )

    // Create a Node.js Lambda function
    const myNodejsFunction = new lambda.Function(this, nodejsAppName, {
      memorySize: myMemory,
      timeout: myTimeout,
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
        NEW_RELIC_NATIVE_METRICS_ENABLED: "false",                     // Reduce cold start duration by not collecting VM metrics
        NEW_RELIC_LOG_ENABLED: "true",                                 // Agent logs
        NEW_RELIC_LOG: "stdout",                                       // Agent log path
        NEW_RELIC_LOG_LEVEL: "info",                                   // Agent log level: fatal, error, warn, info, debug, or trace

        // extension config
        // NEW_RELIC_LICENSE_KEY: ""                                     // New Relic ingest key, overrides Secrets Manager
        NEW_RELIC_LICENSE_KEY_SECRET: licenseKeySecretName,            // Secrets Manager secret name for the extension (can override with env var NEW_RELIC_LICENSE_KEY)
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED: "true",                    // Enable/disable extension
        NEW_RELIC_DATA_COLLECTION_TIMEOUT: "1s",                       // Reduce timeout duration when for "Telemetry client error"
        NEW_RELIC_EXTENSION_LOGS_ENABLED: "true",                      // Enable/disable NR_EXT log lines
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS: "true",                // Send function logs
        NEW_RELIC_EXTENSION_LOG_LEVEL: "DEBUG",                        // INFO or DEBUG
        NEW_RELIC_IGNORE_EXTENSION_CHECKS: "agent",                    // Useful if pinning a known good layer version
        NR_TAGS: "owner:kmullaney;reason:example;description:CDK Node.js example"   // Add tags to log events
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

    // ******************************************* NODEJS 20 ESM

    const nodejsEsmAppName = "nodejs20x-esm"

    // Define the New Relic layer ARN
    const newRelicNodejsEsmLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "NewRelicLambdaNodejsEsmLayer",
      "arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS20X:42"
    )

    // Create a Node.js Lambda function
    const myNodejsEsmFunction = new lambda.Function(this, nodejsEsmAppName, {
      memorySize: myMemory,
      timeout: myTimeout,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("nodejs-esm"),
      handler: "function.handler",
      layers: [newRelicNodejsEsmLayer],
      environment: {
        // distributed tracing config
        NEW_RELIC_ACCOUNT_ID: newRelicAccountId,                       // New Relic account ID
        NEW_RELIC_TRUSTED_ACCOUNT_KEY: newRelicTrustedAccountKey,      // New Relic account ID or parent ID
        NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",                 // DT

        // agent config
        NEW_RELIC_APP_NAME: nodejsEsmAppName,                          // Should be set but not used in the New Relic UI, entity names come from the AWS integration
        NEW_RELIC_NO_CONFIG_FILE: "true",                              // Agent uses environment variables in Lambda
        NEW_RELIC_NATIVE_METRICS_ENABLED: "false",                     // Reduce cold start duration by not collecting VM metrics
        NEW_RELIC_LOG_ENABLED: "true",                                 // Agent logs
        NEW_RELIC_LOG: "stdout",                                       // Agent log path
        NEW_RELIC_LOG_LEVEL: "info",                                   // Agent log level: fatal, error, warn, info, debug, or trace
        // NEW_RELIC_LAMBDA_HANDLER: "function.handler",                  // This points to your original handler, only needed if using the dynamic handler wrapper in layer
        // NEW_RELIC_USE_ESM: "true",                                     // ESM functions that use async/await and not callbacks, only needed if using ESM and the dynamic handler wrapper in layer

        // extension config
        // NEW_RELIC_LICENSE_KEY: ""                                     // New Relic ingest key, overrides Secrets Manager
        NEW_RELIC_LICENSE_KEY_SECRET: licenseKeySecretName,            // Secrets Manager secret name for the extension (can override with env var NEW_RELIC_LICENSE_KEY)
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED: "false",                   // Enable/disable extension
        NEW_RELIC_DATA_COLLECTION_TIMEOUT: "1s",                       // Reduce timeout duration when for "Telemetry client error"
        NEW_RELIC_EXTENSION_LOGS_ENABLED: "true",                      // Enable/disable NR_EXT log lines
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS: "true",                // Send function logs
        NEW_RELIC_EXTENSION_LOG_LEVEL: "DEBUG",                        // INFO or DEBUG
        NEW_RELIC_IGNORE_EXTENSION_CHECKS: "agent",                    // Useful if pinning a known good layer version
        NR_TAGS: "owner:kmullaney;reason:example;description:CDK Node.js ESM example"   // Add tags to log events
      },
    })

    // Set log retention policy to 3 days
    const logGroup = new logs.LogGroup(this, "MyNodejsEsmFunctionLogGroup", {
      logGroupName: `/aws/lambda/${myNodejsEsmFunction.functionName}`,
      retention: logs.RetentionDays.THREE_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: to clean up log group on stack deletion
    })

    // Define the New Relic log ingestion function
    const newRelicLogIngestionFunction = lambda.Function.fromFunctionArn(
      this,
      'NewRelicLogIngestionFunction',
      `arn:aws:lambda:${awsRegion}:${awsAccountId}:function:${logIngestionFunctionName}`
    );

    // Create a subscription filter with a null pattern
    logGroup.addSubscriptionFilter('NewRelicSubscriptionFilter', {
      destination: new destinations.LambdaDestination(newRelicLogIngestionFunction),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Attach necessary IAM policies to the Lambda function
    myNodejsEsmFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["logs:*"],
        resources: ["*"],
      })
    )

    // Attach policy to access the secret
    myNodejsEsmFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [
          `arn:aws:secretsmanager:${awsRegion}:${awsAccountId}:secret:${licenseKeySecretName}*`,
        ],
      })
    )

    // Add tags to the Lambda function
    cdk.Tags.of(myNodejsEsmFunction).add("owner", "kmullaney");
    cdk.Tags.of(myNodejsEsmFunction).add("reason", "example");
    cdk.Tags.of(myNodejsEsmFunction).add("description", "CDK Node.js ESM example");

    // ******************************************* PYTHON 3.12

    const pythonAppName = "python312"

    // Define the New Relic layer ARN
    const newRelicPythonLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "NewRelicLambdaPythonLayer",
      "arn:aws:lambda:us-west-2:451483290750:layer:NewRelicPython312:19"
    )

    // Create a Python Lambda function
    const myPythonFunction = new lambda.Function(this, pythonAppName, {
      memorySize: myMemory,
      timeout: myTimeout,
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
        NEW_RELIC_NO_CONFIG_FILE: "true",                              // Agent uses environment variables in Lambda
        NEW_RELIC_PACKAGE_REPORTING_ENABLED: "false",                  // disable Python agent package reporting feature to improve cold start times
        NEW_RELIC_LOG: "stderr",                                       // Agent log path
        NEW_RELIC_LOG_LEVEL: "info",                                   // Agent log level: fatal, error, warn, info, debug, or trace
        NEW_RELIC_LAMBDA_HANDLER: "function.handler",                  // This points to your original handler, only needed if using the dynamic handler wrapper in layer

        // extension config
        // NEW_RELIC_LICENSE_KEY: ""                                     // New Relic ingest key, overrides Secrets Manager
        NEW_RELIC_LICENSE_KEY_SECRET: licenseKeySecretName,            // Secrets Manager secret name for the extension (can override with env var NEW_RELIC_LICENSE_KEY)
        NEW_RELIC_LAMBDA_EXTENSION_ENABLED: "true",                    // Enable/disable extension
        NEW_RELIC_DATA_COLLECTION_TIMEOUT: "1s",                       // Reduce timeout duration when for "Telemetry client error"
        NEW_RELIC_EXTENSION_LOGS_ENABLED: "true",                      // Enable/disable NR_EXT log lines
        NEW_RELIC_EXTENSION_SEND_FUNCTION_LOGS: "true",                // Send function logs
        NEW_RELIC_EXTENSION_LOG_LEVEL: "DEBUG",                        // INFO or DEBUG
        NEW_RELIC_IGNORE_EXTENSION_CHECKS: "agent",                    // Useful if pinning a known good layer version
        NR_TAGS: "owner:kmullaney;reason:example;description:CDK Python example"   // Add tags to log events
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
