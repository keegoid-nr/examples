// generate-dummy-data.js
const fs = require("fs")

// Function to generate a large payload with dummy data
function generateLargePayload() {
  const dummyMetric = {
    name: "dummy_metric",
    intSum: {
      dataPoints: [],
    },
  }

  // Generate a large number of dummy data points
  for (let i = 0; i < 100000; i++) {
    dummyMetric.intSum.dataPoints.push({
      timeUnixNano: Date.now() * 1e6, // Convert to nanoseconds
      asInt: Math.floor(Math.random() * 1000), // Random integer between 0 and 999
    })
  }

  return {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "dummy_service" } },
            {
              key: "service.instance.id",
              value: { stringValue: "instance-1" },
            },
          ],
        },
        instrumentationLibraryMetrics: [
          {
            instrumentationLibrary: {
              name: "dummy_lib",
              version: "1.0.0",
            },
            metrics: [dummyMetric],
          },
        ],
      },
    ],
  }
}

const largePayload = generateLargePayload()
const payloadString = JSON.stringify(largePayload, null, 2) // Convert to JSON with indentation

// Write the large payload to a file
fs.writeFile("too-large-payload.json", payloadString, (err) => {
  if (err) {
    console.error("Error writing to file:", err)
  } else {
    console.log("Large payload saved to too-large-payload.json")
  }
})
