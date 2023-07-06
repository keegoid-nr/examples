import json
import logging
import os
import requests
from newrelic import agent

# In a python Lambda, the runtime loads the handler code as a module; so code in the top level
# of the module occurs once, during cold start.
print("Lambda Handler starting up")

# configure log level
logging.basicConfig(level=logging.INFO)

@agent.profile_trace()
def get_user():
    print("getting DB username ")
    return "Bill"

@agent.function_trace()
def get_pass():
    print("getting DB password")
    return "123456"

@agent.lambda_handler()
async def lambda_handler(event, context):
    # At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

    # Get the transaction object for this function
    transaction = agent.current_transaction()

    # Accept distributed tracing headers
    headers = event.get("headers", {})
    if headers:
        try:
            transaction.accept_distributed_trace_headers(headers)
        except Exception as e:
            logging.error("An exception occurred accepting dt headers: %s", e, exc_info=True)
    else:
        try:
            # Generate distributed tracing headers if headers are not provided
            headers_list = []
            transaction.insert_distributed_trace_headers(headers_list)
            headers = {k: v for k, v in headers_list}
        except Exception as e:
            logging.error("An exception occurred inserting dt headers: %s", e, exc_info=True)

    # Print out the distributed tracing headers
    print("Distributed tracing headers:")
    logging.info("The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`")
    try:
        for key, value in headers.items():
            print(f"{key}: {value}")
    except Exception as e:
        logging.error("An exception occurred printing dt headers: %s", e, exc_info=True)

    # Make an external HTTP request and inject distributed trace headers
    response = requests.get("https://example.com", headers=headers)

    # additional function processes
    files = os.listdir("/opt/python/")
    with open("/opt/python/package-lock.json", "r") as f:
        package_lock = f.read()
    username = get_user()
    password = get_pass()

    # As normal, anything you write to stdout ends up in CloudWatch
    logging.info("username: ", username)
    logging.info("password: ", password)
    logging.info("ENVIRONMENT VARIABLES\n" + json.dumps(dict(os.environ), indent=2))
    logging.info("EVENT\n" + json.dumps(event, indent=2))
    logging.warning("This is a warning log.")
    logging.error("This is an error log!")
    logging.info(files)
    logging.info("***package-lock.json***\n", package_lock)
    logging.info("logStream: ", context.log_stream_name)

    return response.status_code
