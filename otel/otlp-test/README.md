# OTLP Test

Testing requests to New Relic's OTLP endpoint with curl.

## cURL Test

```sh
curl -i -H 'Content-Type: application/json' -H "api-key: $NEW_RELIC_LICENSE_KEY" -d @samples/spans.json -X POST https://otlp.nr-data.net/v1/traces
```

## time a cURL test to US endpoint

```sh
curl -i -H 'Content-Type: application/json' -H "api-key: $NEW_RELIC_LICENSE_KEY" -d @samples/spans.json -X POST -o /dev/null -s -w "Time Connect: %{time_connect}s\nTime Start Transfer: %{time_starttransfer}s\nTotal time: %{time_total}s\n" https://otlp.nr-data.net/v1/traces
```

## time a cURL test to EU endpoint

```sh
curl -i -H 'Content-Type: application/json' -H "api-key: $NEW_RELIC_LICENSE_KEY" -d @samples/spans.json -X POST -o /dev/null -s -w "Time Connect: %{time_connect}s\nTime Start Transfer: %{time_starttransfer}s\nTotal time: %{time_total}s\n" https://otlp.eu01.nr-data.net/v1/traces
```
