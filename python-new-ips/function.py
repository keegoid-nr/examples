import json
import os
import urllib3
import logging


def lambda_handler(event, context):
    # Create and configure a logger
    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(message)s")
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    new_relic_user_key = os.environ["NEW_RELIC_USER_KEY"]
    new_relic_api_url = "https://api.newrelic.com/graphql"

    query = '{ "query":  "{ requestContext { userId apiKey } }" }'
    headers = {"Content-Type": "application/json", "API-Key": new_relic_user_key}
    logging.info("query = %s | headers = %s", query, headers)

    http = urllib3.PoolManager()
    response = http.request("POST", new_relic_api_url, body=query, headers=headers)
    response_data = json.loads(response.data.decode("utf-8"))

    if response.status == 200:
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "New IP ranges are working correctly.",
                    "response_data": response_data,
                }
            ),
        }
    else:
        return {
            "statusCode": response.status,
            "body": json.dumps(
                {
                    "message": "Error while testing new IP ranges.",
                    "response_data": response_data,
                }
            ),
        }
