import newrelic from "newrelic" // in New Relic layer

// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

export async function handler(event, context) {
  const wrappedHandler = newrelic.setLambdaHandler(async (event, context) => {
    // At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

    // This is an example of a custom event. `FROM MyNodeEvent SELECT *` in New Relic will find this event.
    newrelic.recordCustomEvent("MyNodeEvent", {
      zip: "zap",
    })

    // This attribute gets added to the normal AwsLambdaInvocation event
    newrelic.addCustomAttributes({
      customAttribute: "customAttributeValue",
    })

    // As normal, anything you write to stdout ends up in CloudWatch
    console.log("Hello, world")

    return "Success!"
  })

  return wrappedHandler(event, context)
}
