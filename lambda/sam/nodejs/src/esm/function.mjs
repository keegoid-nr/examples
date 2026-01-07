import newrelic from "newrelic"; // in New Relic layer
import pino from "pino";

const logger = pino();

// 1. In Node.js, console methods are often captured by the agent
// or sent to CloudWatch, where New Relic can ingest them.
// 'apm.service.logging.lines' will reflect these logs if configured.

/**
 * Processes user data from the event, determines a user tier,
 * and adds all information as custom attributes to the transaction.
 */
function processUserData(event) {
  // Use logical OR for default values if keys are missing
  const userId =
    event.userId || `user-guest-${Math.floor(Math.random() * 9000) + 1000}`;
  const cartValue = event.cartValue || 0;

  let userTier;
  // Determine user tier based on cart value for demonstration.
  if (cartValue > 500) {
    userTier = "premium";
  } else if (cartValue > 100) {
    userTier = "standard";
  } else {
    userTier = "guest";
  }

  // Prepare custom attributes to add to the transaction.
  const customAttributes = {
    userId,
    cartValue,
    userTier,
  };

  // Add all attributes to the current transaction.
  newrelic.addCustomAttributes(customAttributes);

  const processedData = {
    processed: true,
    userId,
    userTier,
  };

  // 2. These log lines will be intercepted if log enrichment/collection is enabled.
  logger.info(`Successfully processed user data for user: ${userId}`);

  // Example of a different level:
  logger.debug(`Raw processed data: ${JSON.stringify(processedData)}`);

  return processedData;
}

// The main handler for the Lambda function.
export async function handler(event, context) {
  // 3. Logging at the entry point.
  logger.info("Lambda handler invoked");

  // Call the instrumented function.
  // We can wrap this in a segment to show more detail in the UI.
  const processedData = await newrelic.startSegment(
    "processUserData",
    true,
    () => processUserData(event)
  );

  // The response from the Lambda function.
  return {
    statusCode: 200,
    body: JSON.stringify(processedData),
  };
}
