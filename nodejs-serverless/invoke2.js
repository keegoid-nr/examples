// Load the AWS SDK for Node.js
const AWS = require("aws-sdk")

// Set the region and endpoint to use the local serverless-offline instance
AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:3002",
})

// Create a Lambda object
const lambda = new AWS.Lambda()

// Define the parameters for invoking the Lambda function
const params = {
  FunctionName: "nodejs16x", // Use the function name provided
  Payload: JSON.stringify({ key1: "value1", key2: "value2", key3: "value3" }), // Customize the payload as needed
}

// Invoke the Lambda function
lambda.invoke(params, (err, data) => {
  if (err) {
    console.error("Error invoking Lambda function:", err)
  } else {
    console.log("Lambda function result:", JSON.parse(data.Payload))
  }
})
