# OTLP Test

Testing requests to New Relic's OTLP endpoint with curl.

## cURL Test

```sh
curl -i -H 'Content-Type: application/json' -H 'Api-Key: [REDACTED]' -H 'Data-Format: newrelic' -H 'Data-Format-Version: 1' -X POST -d @span2.json https://otlp.nr-data.net:4318/v1/traces
```
