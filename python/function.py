import newrelic.agent
import requests
import subprocess

# In a python Lambda, the runtime loads the handler code as a module; so code in the top level
# of the module occurs once, during cold start.
print("Lambda Handler starting up")


@newrelic.agent.lambda_handler()
def lambda_handler(event, context):
    # At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

    # Get the transaction object for this function
    transaction = newrelic.agent.current_transaction()

    # Accept distributed tracing headers
    headers = event.get("headers", {})
    transaction.accept_distributed_trace_headers(headers)

    # Print out the distributed tracing headers
    # trace_headers = transaction.distributed_trace_headers()
    # print("Distributed tracing headers:")
    # for key, value in trace_headers.items():
    #     print(f"{key}: {value}")

    # Print out the distributed tracing headers
    print("Distributed tracing headers:")
    for key, value in headers.items():
        print(f"{key}: {value}")

    # Make an external HTTP request and inject distributed tracing headers
    url = "https://example.com/api"
    headers = {}
    transaction.insert_distributed_trace_headers(headers)
    response = requests.get(url, headers=headers)

    # perform cURL operation and print results
    cmd = ["curl", "-vvv", url]
    r = subprocess.run(cmd, capture_output=True, check=True, text=True)
    print("***STDOUT***\n", r.stdout)
    print("***STDERR***\n", r.stderr)
    print("response.status_code: ", response.status_code)

    return r.returncode
