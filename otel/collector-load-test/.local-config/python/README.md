<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [OTel Load Test](#collector-load-test)
  - [collector-load-test.py](#collector-load-testpy)
    - [Prerequisites:](#prerequisites)
    - [Docker](#docker)
    - [Kubernetes](#kubernetes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# OTel Load Test

## collector-load-test.py

**There is currently an issue with the Python app that causes it to not send metrics to the collector fast enough.**

Python's OpenTelemetry SDK is well-suited for generating and sending telemetry data, like metrics. This is a basic Python application that generates a high volume of metrics and sends them through an OpenTelemetry collector.

Two types of metrics are generated:

- `metricName = 'http_requests'` - a Counter which records the number of http requests, and associates them with an `http.method`, `http.status_code`, and `http.server.duration`.
- `metricName = 'error_rate'` - a Gauge which records the error rate for `http.status_code > 204`, and associates them with an `http.method` and `http.server.duration`.

Each metric has attributes:

- `http.method`
- `http.status_code`
- `http.server.duration`

### Prerequisites:

- Python 3.12
- Docker 24.0.7

### Docker

The Docker option is a great way to test the collector and app locally before attempting to install in Kubernetes.

1. Create `requirements.txt`.

    ```sh
    $(brew --prefix python@3.12)/bin/python3.12 -m venv .venv
    . .venv/bin/activate
    pip install opentelemetry-api
    pip install opentelemetry-sdk
    pip install opentelemetry-exporter-otlp
    pip freeze > requirements.txt
    ```

1. Create `.env` in the [docker](../docker/) directory with the following variables.

    ```sh
    NEW_RELIC_OTLP_ENDPOINT=https://otlp.nr-data.net:4317
    NEW_RELIC_LICENSE_KEY=YOUR_INGEST_KEY
    RUNTIME=python
    ```

1. Run the [build_and_run.sh](../docker/build_and_run.sh) script.

    ```sh
    ./build_and_run.sh
    ```

### Kubernetes

1. TBD
