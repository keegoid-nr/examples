#!/bin/sh

curl -X POST "https://log-api.newrelic.com/log/v1" \
     -H "Content-Type: application/json" \
     -H "Api-Key: $NEW_RELIC_LICENSE_KEY" \
     -d '[
           {
             "message": "This is a test log message from curl",
             "timestamp": '"$(date +%s%3N)"',
             "attributes": {
               "service": "my-test-service",
               "logtype": "my-test-log-type"
             }
           }
         ]'
