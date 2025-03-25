import newrelic.agent
import requests
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

@newrelic.agent.lambda_handler()
def lambda_handler(event, context):
    try:
        # Extract delay and request_timeout from the event, with defaults (10s max)
        delay = event.get('delay', 10)
        request_timeout = event.get('request_timeout', 5)
        # Get Lambda timeout calculated from context
        lambda_timeout = round(context.get_remaining_time_in_millis() / 1000)

        # Log the details
        logger.info('Making ' + str(delay) + 's request with ' + str(request_timeout) + 's timeout. Lambda timeout is ' + str(lambda_timeout) + 's')

        # timeout set so request will run for some seconds and requests library will raise a requests.exceptions.Timeout exception
        response = requests.get('https://httpbin.org/delay/' + str(delay), timeout=request_timeout)
        logger.info('Request completed')
        logger.info('Status code: ' + str(response.status_code))
        return {
            'statusCode': response.status_code,
            'body': response.text
        }
    # here we catch the requests.exceptions.Timeout exception
    except requests.exceptions.Timeout:
        logger.error('Request timed out')
        logger.error('Status code: 504')
        newrelic.agent.notice_error()
        return {
            'statusCode': 504,
            'body': 'Request timed out'
        }