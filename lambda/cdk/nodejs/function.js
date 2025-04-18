"use strict"
const newrelic = require("newrelic")
const axios = require("axios")

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

exports.handler = async (event, context) => {
  // Call newrelic.getTransaction to retrieve a handle on the current transaction.
  const transaction = newrelic.getTransaction()

  // log out the event object to see details about what triggered the function
  console.log("stringified event")
  console.log(JSON.stringify(event))

  // Accept distributed tracing headers
  let headers = event.headers || {}
  if (!headers.hasOwnProperty("newrelic")) {
    try {
      // Generate distributed tracing headers if headers are not provided
      newrelic.startBackgroundTransaction(
        "background task",
        function executeTransaction() {
          const backgroundT = newrelic.getTransaction()
          // Generate the headers
          backgroundT.insertDistributedTraceHeaders(headers)
        }
      )
    } catch (error) {
      console.log("An exception occurred inserting dt headers:", error.message)
    }
  } else {
    try {
      transaction.acceptDistributedTraceHeaders("HTTP", headers)
    } catch (error) {
      console.log("An exception occurred accepting dt headers:", error.message)
    }
  }

  // add custom attribute
  console.log("NR: adding custom attribute")
  newrelic.addCustomAttribute("customAttribute","1234")

  // Print out the distributed tracing headers
  console.log("Distributed tracing headers:")
  console.info("The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`")
  try {
    for (let key in headers) {
      console.log(`${key}: ${headers[key]}`)
    }
  } catch (error) {
    console.log("An exception occurred printing dt headers:", error.message)
  }

  // Make an external HTTP request and inject distributed trace headers
  let resp = await axios.get("https://newrelic.com", { headers })

  let username = get_user()
  let password = get_pass()

  // As normal, anything you write to stdout ends up in CloudWatch
  console.info("username: ", username)
  console.info("password: ", password)

  const response = {
    statusCode: resp.status,
    body: "Hello from Lambda!",
  }
  return response
}
