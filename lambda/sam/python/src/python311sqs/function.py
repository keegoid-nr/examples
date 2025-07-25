import newrelic.agent
import logging
import httpx

# In a python Lambda, the runtime loads the handler code as a module; so code in the top level
# of the module occurs once, during cold start.
print("Lambda Handler starting up")

@newrelic.agent.profile_trace()
def get_user():
    print("getting DB username ")
    return "Bill"

# @newrelic.agent.function_trace() # less detail
@newrelic.agent.profile_trace() # more detail
def get_pass():
    print("getting DB password")
    return "123456"

def handler(event, context):
    # At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

    # Create and configure a logger
    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s")
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Get the transaction object for this function
    transaction = newrelic.agent.current_transaction()

    # Log the event object to see key formats for eventSource and other attributes
    events = event.get("Records", [])
    if events:
        try:
          for record in events:
              logging.info("Event Record: %s", record)
        except Exception as e:
            logging.error("An exception occurred logging event records: %s", e, exc_info=True)
    else:
        logging.info("Event: %s", event)

    # Accept distributed tracing headers
    headers = event.get("headers", {})
    if headers:
        try:
            transaction.accept_distributed_trace_headers(headers)
        except Exception as e:
            logging.error(
                "An exception occurred accepting dt headers: %s", e, exc_info=True
            )
    else:
        try:
            # Generate distributed tracing headers if headers are not provided
            headers_list = []
            transaction.insert_distributed_trace_headers(headers_list)
            headers = {k: v for k, v in headers_list}
        except Exception as e:
            logging.error(
                "An exception occurred inserting dt headers: %s", e, exc_info=True
            )

    # Print out the distributed tracing headers
    print("Distributed tracing headers:")
    logging.info(
        "The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`"
    )
    try:
        for key, value in headers.items():
            print(f"{key}: {value}")
    except Exception as e:
        logging.error("An exception occurred printing dt headers: %s", e, exc_info=True)

    with httpx.Client() as client:
        resp = client.get("https://newrelic.com")

    # This is an example of a custom event. `FROM MyPythonEvent SELECT *` in New Relic will find this event.
    newrelic.agent.record_custom_event("MyPythonEvent", {
        "zip": "zap"
    })
    # This attribute gets added to the normal AwsLambdaInvocation event
    newrelic.agent.add_custom_attribute('customAttribute', 'customAttributeValue')

    # additional function processes
    username = get_user()
    password = get_pass()

    # As normal, anything you write to stdout ends up in CloudWatch
    print("username: ", username)
    print("password: ", password)

    return {
        "statusCode": resp.status_code,
        "body": "Hello from Lambda!"
    }
