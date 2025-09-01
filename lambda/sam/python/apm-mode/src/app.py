import json
import random
import newrelic.agent

# A background task to process user data and add custom attributes.
# This demonstrates instrumenting a specific part of your code.
@newrelic.agent.background_task()
def process_user_data(event):
    """
    Processes user data from the event, determines a user tier,
    and adds all information as custom attributes to the transaction.
    """
    # Use .get() to safely access keys that may not exist in the event.
    user_id = event.get("userId", f"user-guest-{random.randint(1000, 9999)}")
    cart_value = event.get("cartValue", 0)

    # Determine user tier based on cart value for demonstration.
    if cart_value > 500:
        user_tier = "premium"
    elif cart_value > 100:
        user_tier = "standard"
    else:
        user_tier = "guest"

    # Prepare a dictionary of custom attributes to add to the transaction.
    custom_attributes = {
        "userId": user_id,
        "cartValue": cart_value,
        "userTier": user_tier,
    }

    # Add all attributes in a single API call.
    # The .items() method provides the required list of (key, value) tuples.
    newrelic.agent.add_custom_attributes(list(custom_attributes.items()))

    # This dictionary is returned as the function's output.
    processed_data = {
        "processed": True,
        "userId": user_id,
        "userTier": user_tier
    }

    print(f"Processed data: {processed_data}")
    return processed_data

# The main handler for the Lambda function.
def lambda_handler(event, context):
    """
    AWS Lambda handler function.
    This function calls our background task to process the event data.
    """
    print(f"Received event: {json.dumps(event)}")

    # Call the instrumented background task.
    processed_data = process_user_data(event)

    # The response from the Lambda function.
    return {
        "statusCode": 200,
        "body": json.dumps(processed_data),
    }
