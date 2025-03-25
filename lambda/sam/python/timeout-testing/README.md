# Timeout-Testing: Managing External Calls in Lambda with New Relic

This section provides examples and techniques for handling external calls in AWS Lambda functions to prevent runtime timeouts (e.g., `Sandbox.Timeout` errors) and ensure accurate error duration reporting in New Relic. Proper management of external calls is critical in serverless environments, especially when using the New Relic Python agent.

## Problem Statement

When a Lambda function exceeds its configured timeout—resulting in a `Sandbox.Timeout` error—the New Relic Python agent may record an inaccurate error duration, such as the maximum signed 64-bit integer (approximately 292 years). This occurs because the Lambda runtime terminates the function abruptly, preventing the agent from capturing meaningful timing data. For functions making external API calls, this can lead to unreliable monitoring and hinder troubleshooting efforts.

Additionally, if an external call is handled properly (e.g., with a timeout and exception handling), no error is automatically recorded in New Relic unless explicitly reported. This makes it necessary to use the Python agent API to "notice" errors manually when desired.

## Solution Overview

The goal is to prevent Lambda runtime timeouts by proactively managing external calls and to ensure accurate error tracking in New Relic. This repository demonstrates the following techniques:

- **Timeout Handling**: Set explicit timeouts for external API calls to avoid indefinite waits.
- **Exception Handling**: Catch and process exceptions to allow the function to complete gracefully.
- **Manual Error Reporting**: Use the New Relic Python agent API to record errors when external calls fail, even if handled successfully within the function.

These techniques are implemented in the source code under [`src/request_timeout/python312_handled_timeout/function.py`](https://github.com/keegoid-nr/examples/blob/6688e44e0fb7b6130241844dbfafee3da52e83fe/lambda/sam/python/timeout-testing/src/request_timeout/python312_handled_timeout/function.py#L32).

## Implementation Details

### Example Code

Here's an example from the repository that demonstrates proper handling of an external API call:

```python
import requests
import json
import newrelic.agent

def lambda_handler(event, context):
    try:
        # External API call with a 5-second timeout
        response = requests.get('https://some-slow-api.com/data', timeout=5)
        # Process the response if successful
        data = response.json()
        return {
            'statusCode': 200,
            'body': json.dumps('Success')
        }
    except requests.exceptions.Timeout:
        # Handle timeout and manually report to New Relic
        newrelic.agent.notice_error()  # Explicitly record the error
        return {
            'statusCode': 504,
            'body': json.dumps('External API call timed out')
        }
    except Exception as e:
        # Handle other exceptions and report to New Relic
        newrelic.agent.notice_error()
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

### Key Techniques Explained

1. **Timeout Handling**:
   - The `requests.get()` call includes a `timeout=5` parameter, limiting the wait time to 5 seconds.
   - This ensures the external call does not exceed the Lambda function's timeout, avoiding a `Sandbox.Timeout` error.

2. **Exception Handling**:
   - Specific exceptions like `requests.exceptions.Timeout` are caught, allowing the function to return a controlled response (e.g., HTTP 504) rather than failing silently or timing out.
   - A general `Exception` block catches unexpected errors, ensuring the function completes execution.

3. **New Relic Error Reporting**:
   - If the external call fails (e.g., due to a timeout), no error is recorded in New Relic unless explicitly reported.
   - The `newrelic.agent.notice_error()` function is called to log the error manually, ensuring accurate tracking in New Relic dashboards.

By handling the external call properly, the Lambda runtime timeout is avoided, and error durations remain accurate.

## Best Practices for Using the New Relic Python Agent in Lambda

To maximize the effectiveness of the New Relic Python agent in Lambda functions, follow these best practices:

1. **ConfigureTimeouts Strategically**:
   - Set timeouts for external calls (e.g., `requests.get(timeout=5)`) lower than the Lambda function's overall timeout.
   - This gives the function time to handle exceptions and complete execution gracefully.

2. **Handle Exceptions Proactively**:
   - Catch specific exceptions (e.g., `requests.exceptions.Timeout`, `requests.exceptions.ConnectionError`) to manage failures.
   - Avoid letting unhandled exceptions propagate, as they could lead to runtime timeouts.

3. **Manually Notice Errors in New Relic**:
   - When an external call fails but is handled within the function (e.g., returning a 504 status), use `newrelic.agent.notice_error()` to log the event.
   - This ensures visibility into issues that don't cause the function to fail outright.

4. **Test and Monitor**:
   - Use New Relic dashboards to verify that error durations are recorded accurately.
   - Combine with AWS CloudWatch logs to debug timeout-related issues and refine timeout settings.

5. **Optimize Lambda Configuration**:
   - Set the Lambda timeout slightly higher than the sum of expected execution time and external call timeouts.
   - This provides a buffer for handling exceptions without risking a `Sandbox.Timeout`.

## Why This Matters

Avoiding Lambda runtime timeouts prevents the New Relic Python agent from reporting misleading error durations. By implementing these techniques, you ensure:

- **Accurate Monitoring**: Error durations reflect actual execution times, not arbitrary large values.
- **Reliable Troubleshooting**: Clear error reporting aids in diagnosing issues with external services.
- **Robust Applications**: Graceful handling of failures improves the resilience of serverless functions.

## Conclusion

This repository showcases practical solutions for managing external calls in Lambda functions, with a focus on preventing timeouts and integrating effectively with the New Relic Python agent. Explore the code in [`src/request_timeout/python312_handled_timeout/function.py`](https://github.com/keegoid-nr/examples/blob/6688e44e0fb7b6130241844dbfafee3da52e83fe/lambda/sam/python/timeout-testing/src/request_timeout/python312_handled_timeout/function.py#L32) to see these techniques in action.

For more information, refer to the [New Relic Python agent documentation](https://docs.newrelic.com/docs/apm/agents/python-agent/).
