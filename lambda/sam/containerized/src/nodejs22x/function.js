const newrelic = require("newrelic");
const winston = require("winston");

// Create a custom format that adds New Relic metadata
// This replaces @newrelic/winston-enricher which was causing runtime errors
const newrelicFormatter = winston.format((info) => {
  const metadata = newrelic.getLinkingMetadata();
  return { ...info, ...metadata };
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.json(), newrelicFormatter()),
  defaultMeta: { service: "lambda-test-service" },
  transports: [new winston.transports.Console()],
});

exports.handler = async (event, context) => {
  // Wrap the entire logic to ensure logs are captured
  logger.info("Lambda invocation started", { event });

  // Record custom event
  newrelic.recordCustomEvent("LambdaInvocationStart", {
    awsRequestId: context.awsRequestId,
    functionName: context.functionName,
    hasQueryParam: !!(
      event.queryStringParameters && event.queryStringParameters.name
    ),
  });

  // Add custom attribute
  if (event.queryStringParameters && event.queryStringParameters.name) {
    newrelic.addCustomAttribute("userName", event.queryStringParameters.name);
  }

  let responseMessage = "Hello, World from Node.js 22 Lambda!";

  // Check if there is a name present in queryParameters
  if (event.queryStringParameters && event.queryStringParameters.name) {
    const name = event.queryStringParameters.name;
    logger.info(`Processing request for user: ${name}`);
    responseMessage = `Hello, ${name} from Node.js 22 Lambda!`;
  } else {
    logger.warn("No name provided in query parameters, using default greeting");
  }

  // Simulate some work
  newrelic.startSegment("simulateWork", true, () => {
    logger.debug("Simulating work segment...");
    // just a placeholder for segment
  });

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: responseMessage }),
  };

  logger.info("Lambda invocation finishing", {
    statusCode: response.statusCode,
  });

  return response;
};
