"use strict"
const newrelic = require("newrelic")
const axios = require("axios")

console.log("Lambda Handler starting up")

function get_user() {
  console.log("getting DB username ")
  return "Bill"
}

function get_pass() {
  console.log("getting DB password")
  return "123456"
}

exports.handler = newrelic.setLambdaHandler(async (event, context) => {
  const transaction = newrelic.getTransaction()

  // log out the event object to see details about what triggered the function
  console.log("stringified event")
  console.log(JSON.stringify(event))

  let headers = event.headers || {}
  if (!headers.hasOwnProperty("newrelic")) {
    try {
      newrelic.startBackgroundTransaction(
        "background task",
        function executeTransaction() {
          const backgroundT = newrelic.getTransaction()
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

  console.log("NR: adding custom attribute")
  newrelic.addCustomAttribute("customAttribute", "1234")

  console.log("Distributed tracing headers:")
  console.info("The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`")
  try {
    for (let key in headers) {
      console.log(`${key}: ${headers[key]}`)
    }
  } catch (error) {
    console.log("An exception occurred printing dt headers:", error.message)
  }

  let resp
  try {
    resp = await axios.get("https://newrelic.com", { headers })
  } catch (error) {
    console.log("An exception occurred making the HTTP request:", error.message)
    return {
      statusCode: 500,
      body: "Internal Server Error",
    }
  }

  let username = get_user()
  let password = get_pass()

  console.info("username: ", username)
  console.info("password: ", password)

  const response = {
    statusCode: resp.status,
    body: "Hello from Lambda!",
  }
  return response
})
