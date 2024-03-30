# OTLP Test

Testing requests to New Relic's OTLP endpoint with curl.

## cURL Test

```sh
curl -i -H 'Content-Type: application/json' -H "api-key: $NEW_RELIC_LICENSE_KEY" -H 'Data-Format: newrelic' -H 'Data-Format-Version: 1' -d @span2.json -X POST https://otlp.nr-data.net:4318/v1/traces
```
