# import newrelic.agent
import subprocess

# In a python Lambda, the runtime loads the handler code as a module; so code in the top level
# of the module occurs once, during cold start.
print("Lambda Handler starting up")

def lambda_handler(event, context):
  # At this point, we're handling an invocation. Cold start is over; this code runs for each invocation.

  # perform cURL operation and print results
  cmd = ["curl", "-vvv", "https://log-api.eu.newrelic.com/log/v1/"]
  r = subprocess.run(cmd, capture_output=True, check=True, text=True)
  print("***STDOUT***\n", r.stdout)
  print("***STDERR***\n", r.stderr)
  return r.returncode
