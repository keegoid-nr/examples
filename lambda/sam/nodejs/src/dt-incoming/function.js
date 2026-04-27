"use strict"
const newrelic = require("newrelic")

console.log(JSON.stringify({ level: "INFO", message: "Lambda Handler starting up" }))

exports.handler = async (event, context) => {
  // Step 1: Log the full event to confirm the POST arrived and inspect all fields.
  // Compare the headers here against what the upstream reports it sent.
  console.log(JSON.stringify({
    level: "INFO",
    message: "Processing new event",
    details: event,
  }))

  // Step 2: Extract DT-relevant headers (case-insensitive fallback for ALB vs API GW casing).
  const headers = event.headers || {}
  const dtHeaders = {
    traceparent: headers["traceparent"] || headers["Traceparent"],
    tracestate:  headers["tracestate"]  || headers["Tracestate"],
    newrelic:    headers["newrelic"]    || headers["Newrelic"],
  }
  console.log(JSON.stringify({
    level: "INFO",
    message: "Incoming distributed trace headers",
    details: dtHeaders,
  }))

  // Step 3: Manually accept DT headers.
  // The agent auto-accepts for some trigger types, but for direct POST payloads
  // or when auto-instrumentation doesn't pick up the headers, call this explicitly.
  const transaction = newrelic.getTransaction()
  if (dtHeaders.newrelic || dtHeaders.traceparent) {
    try {
      transaction.acceptDistributedTraceHeaders("HTTP", headers)
      console.log(JSON.stringify({ level: "INFO", message: "Accepted distributed trace headers" }))
    } catch (error) {
      console.log(JSON.stringify({ level: "ERROR", message: "Failed to accept distributed trace headers", error: error.message }))
    }
  } else {
    console.log(JSON.stringify({ level: "WARN", message: "No distributed trace headers found — upstream may not be sending them or headers were stripped in transit" }))
  }

  // Step 4: Log NR trace context after accepting.
  // traceId here should match the trace.id in the upstream span/transaction.
  // If they don't match, the link is broken — check step 3 error or upstream header value.
  const traceMetadata = newrelic.getTraceMetadata()
  console.log(JSON.stringify({
    level: "INFO",
    message: "New Relic trace context (compare traceId with upstream trace.id)",
    details: traceMetadata,
  }))

  return { statusCode: 200, body: JSON.stringify({ message: "ok" }) }
}
