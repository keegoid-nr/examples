const newrelic = require("newrelic")

// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

// Function that throws an error if New Relic trace header is missing
function performSomeTask(event) {
  // Check for New Relic trace header in the event object
  // if (!event.headers || !event.headers['newrelic']) {
  //   throw new Error("New Relic trace header not found")
  // }

  // Simulate performing some task with the input
  console.log("Performing some task with input:", event.input)

  // Simulate an error if input is missing
  // if (!event.input) {
  //   throw new Error("Input is required for performSomeTask")
  // }

  // Simulate successful task completion
  console.log("Task completed successfully")
}

exports.handler = async (event, context) => {
  // At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

  // This is an example of a custom event. `FROM MyNodeEvent SELECT *` in New Relic will find this event.
  newrelic.recordCustomEvent("MyNodeEvent", {
    zip: "zap",
  })

  // This attribute gets added to the normal AwsLambdaInvocation event
  newrelic.addCustomAttributes({
    customAttribute: "customAttributeValue",
  })

  // This metric gets added to the normal AwsLambdaInvocation event
  newrelic.recordMetric("MyNodeMetric", 1)

  // Notice an error inside a try/catch block
  try {
    performSomeTask(event)
  } catch (err) {
    newrelic.noticeError(
      err,
      { extraInformation: "error already handled in the application" },
      true
    )
    // Re-throw the error to ensure the Lambda function fails
    throw err
  }

  // As normal, anything you write to stdout ends up in CloudWatch
  console.log("Hello, world")

  return "Success!"
}
