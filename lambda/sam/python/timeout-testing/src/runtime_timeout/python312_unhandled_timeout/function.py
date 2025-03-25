import requests
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    # Extract delay and request_timeout from the event, with defaults (10s max)
    delay = event.get('delay', 10)
    # Get Lambda timeout calculated from context
    lambda_timeout = round(context.get_remaining_time_in_millis() / 1000)

    # Log the details
    logger.info('Making ' + str(delay) + 's request with no request timeout. Lambda timeout is ' + str(lambda_timeout) + 's')

    # no timeout set so request will run indefinitely until runtime timeout is reached
    response = requests.get('https://httpbin.org/delay/' + str(delay))
    logger.info('Request completed')
    logger.info('Status code: ' + str(response.status_code))
    return {
        'statusCode': response.status_code,
        'body': response.text
    }
