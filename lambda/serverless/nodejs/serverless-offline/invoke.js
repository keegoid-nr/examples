// Import required AWS SDK clients and commands for Node.js
const { Lambda } = require("@aws-sdk/client-lambda")
const fs = require("fs")

// Create a Lambda client with the custom endpoint
const lambda = new Lambda({
  region: "us-west-2",
  endpoint: "http://localhost:3002",
})

// Read the event.json file and parse its content as JSON
const event = JSON.parse(fs.readFileSync("event.json", "utf8"))

// Define the parameters for invoking the Lambda function
const params = {
  FunctionName: "kmullaney-ext-only-dev-nodejs20x", // Use the function name provided
  Payload: JSON.stringify(event), // Use the parsed event as the payload
}

// Invoke the Lambda function
;(async () => {
  try {
    const data = await lambda.invoke(params)
    console.log("Lambda function result:", JSON.parse(data.Payload))
  } catch (err) {
    console.error("Error invoking Lambda function:", err)
  }
})()
