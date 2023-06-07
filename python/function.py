from newrelic import agent
import requests

# In a python Lambda, the runtime loads the handler code as a module; so code in the top level
# of the module occurs once, during cold start.
print("Lambda Handler starting up")

@agent.profile_trace()
def get_user():
    print("getting DB username ")
    return "Bill"

@agent.function_trace()
def get_pass():
    print("getting DB password")
    return "123456"

@agent.lambda_handler()
def lambda_handler(event, context):
    # At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

    # Get the transaction object for this function
    transaction = agent.current_transaction()

    # Accept distributed tracing headers
    headers = event.get("headers", {})
    if headers:
        transaction.accept_distributed_trace_headers(headers)
    else:
        # Generate distributed tracing headers if headers are not provided
        headers_list = []
        transaction.insert_distributed_trace_headers(headers_list)
        headers = {k: v for k, v in headers_list}

    # Make an external HTTP request and inject distributed trace headers
    response = requests.get("https://example.com", headers=headers)

    # additional function processes
    username = get_user()
    password = get_pass()

    # As normal, anything you write to stdout ends up in CloudWatch
    print("Hello, world")
    print("username: ",username)
    print("password: ",password)

    # Print out the distributed tracing headers
    print("Distributed tracing headers:")
    for key, value in headers.items():
        print(f"{key}: {value}")

    print("The proprietary `newrelic` header can be decoded with: `pbpaste | base64 -d | jq .`")

    return response.status_code
