<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [OTel Load Test](#otel-load-test)
  - [main.go](#maingo)
  - [Prerequisites:](#prerequisites)
  - [Setup](#setup)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# OTel Load Test

## main.go

Go's OpenTelemetry SDK is well-suited for generating and sending telemetry data, like metrics. This is a basic Go application that generates a high volume of metrics and sends them through an OpenTelemetry collector.

Two types of metrics are generated:

- `metricName = 'http_requests'` - a Counter which records the number of http requests, and associates them with an `http.method`, `http.status_code`, and `http.server.duration`.
- `metricName = 'error_rate'` - a Gauge which records the error rate for `http.status_code > 204`, and associates them with an `http.method` and `http.server.duration`.

Each metric has attributes:

- `http.method`
- `http.status_code`
- `http.server.duration`

## Prerequisites:

- Go 1.22
- Docker 25.03

## Setup

The Docker option is a great way to test the collector and app locally before attempting to install in Kubernetes.

1. Init your Go module to generate the `go.mod` and `go.sum` files.

    ```sh
    go mod init github.com/YOUR_REPO_NAME/collector-load-test
    go mod tidy
    ```
