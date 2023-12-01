const AWS = require("aws-sdk")
const lambda = new AWS.Lambda()

const targetFunctionName = "kmullaney-load-test-dev-nodejs18x"

async function invokeTargetLambda() {
  const params = {
    FunctionName: targetFunctionName,
    InvocationType: "Event", // Asynchronously invoke the target Lambda function
    Payload: JSON.stringify({ numPumpkins: 1000 }),
  }

  return lambda.invoke(params).promise()
}

exports.handler = async () => {
  const numInvocations = 60
  let invocationPromises = []

  for (let i = 0; i < numInvocations; i++) {
    const invocationPromise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await invokeTargetLambda()
          console.log(`Invocation ${i + 1} is triggered.`)
          resolve()
        } catch (err) {
          console.error(
            "An error occurred during target Lambda invocation: ",
            err
          )
          reject(err)
        }
      }, i * 1000) // One-second intervals
    })

    invocationPromises.push(invocationPromise)
  }

  // Wait for all invocations to complete
  await Promise.all(invocationPromises)
}
