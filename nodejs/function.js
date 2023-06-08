const axios = require("axios")
const newrelic = require("newrelic")
const fs = require("fs")

// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

function get_user() {
  console.log("getting DB username ")
  return "Bill"
}

function get_pass() {
  console.log("getting DB password")
  return "123456"
}

module.exports.lambda_handler = async function (event, context) {
  // Call newrelic.getTransaction to retrieve a handle on the current transaction.
  const transaction = newrelic.getTransaction()

  // Accept distributed tracing headers
  let headers = event.headers || {}
  if (!headers.hasOwnProperty("newrelic")) {
    // Generate distributed tracing headers if headers are not provided
    newrelic.startBackgroundTransaction(
      "background task",
      function executeTransaction() {
        const backgroundT = newrelic.getTransaction()
        // Generate the headers
        backgroundT.insertDistributedTraceHeaders(headers)
      }
    )
  } else {
    transaction.acceptDistributedTraceHeaders("HTTP", headers)
  }

  // Print out the distributed tracing headers
  console.log("Distributed tracing headers:")
  for (let key in headers) {
    console.info(`${key}: ${headers[key]}`)
  }
  console.log(
    "The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`"
  )

  // Make an external HTTP request and inject distributed trace headers
  let response = await axios.get("https://example.com", { headers })

  // additional function processes
  let files = fs.readdirSync("/opt/nodejs/")
  let packageLock = fs.readFileSync("/opt/nodejs/package-lock.json").toString()
  let username = get_user()
  let password = get_pass()

  // As normal, anything you write to stdout ends up in CloudWatch
  console.info("username: ", username)
  console.info("password: ", password)
  console.info("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  console.warn("This is a warning log.")
  console.info(files)
  console.info("***package-lock.json***\n", packageLock)
  console.info("logStream: ", context.logStreamName)

  return response.status
  // return context.logStreamName
}
