import newrelic from newrelic

// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

const lambda_handler = async (event, context) => {

  return context.logStreamName
}

export { lambda_handler }
