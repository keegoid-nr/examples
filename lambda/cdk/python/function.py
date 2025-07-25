import newrelic.agent
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
    with httpx.Client() as client:
        response = client.get("https://newrelic.com")
        print(response.status_code)

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
    print("Hello, world")
    print("username: ", username)
    print("password: ", password)

    return {
        "statusCode": 200,
        "body": "Hello from Lambda!"
    }
