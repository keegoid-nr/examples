<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Docker Setup](#docker-setup)
  - [Troubleshooting](#troubleshooting)
  - [Notes](#notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Docker Setup

This directory contains the config files necessary to run the collector-load-test app and the collector in Docker.

1. Create a `.env` file to store your New Relic license (ingest) key and other variables.

    ```sh
    NEW_RELIC_LICENSE_KEY=
    NEW_RELIC_OTLP_ENDPOINT=https://otlp.nr-data.net
    COLLECTOR_CONFIG=collector.yaml
    RUNTIME=go
    METRICS_PER_SECOND=10
    ```

2. Run the [build_and_run.sh](../docker/build_and_run.sh) script.

    ```sh
    ./build_and_run.sh
    ```

## Troubleshooting

If the collector is not configured correctly, it may not export metrics fast enough. In that case, you'll see an error like the following for the Go app:

```log
otel-collector-1  | 2023-12-07T21:06:16.517Z    error   exporterhelper/queue_sender.go:229      Dropping data because sending_queue is full. Try increasing queue_size. {"kind": "exporter", "data_type": "metrics", "name": "otlp", "dropped_items": 104}
otel-collector-1  | go.opentelemetry.io/collector/exporter/exporterhelper.(*queueSender).send
otel-collector-1  |     go.opentelemetry.io/collector/exporter@v0.90.1/exporterhelper/queue_sender.go:229
otel-collector-1  | go.opentelemetry.io/collector/exporter/exporterhelper.(*baseExporter).send
otel-collector-1  |     go.opentelemetry.io/collector/exporter@v0.90.1/exporterhelper/common.go:193
otel-collector-1  | go.opentelemetry.io/collector/exporter/exporterhelper.NewMetricsExporter.func1
otel-collector-1  |     go.opentelemetry.io/collector/exporter@v0.90.1/exporterhelper/metrics.go:98
otel-collector-1  | go.opentelemetry.io/collector/consumer.ConsumeMetricsFunc.ConsumeMetrics
otel-collector-1  |     go.opentelemetry.io/collector/consumer@v0.90.1/metrics.go:25
otel-collector-1  | go.opentelemetry.io/collector/internal/fanoutconsumer.(*metricsConsumer).ConsumeMetrics
otel-collector-1  |     go.opentelemetry.io/collector@v0.90.1/internal/fanoutconsumer/metrics.go:73
otel-collector-1  | go.opentelemetry.io/collector/processor/batchprocessor.(*batchMetrics).export
otel-collector-1  |     go.opentelemetry.io/collector/processor/batchprocessor@v0.90.1/batch_processor.go:442
otel-collector-1  | go.opentelemetry.io/collector/processor/batchprocessor.(*shard).sendItems
otel-collector-1  |     go.opentelemetry.io/collector/processor/batchprocessor@v0.90.1/batch_processor.go:256
otel-collector-1  | go.opentelemetry.io/collector/processor/batchprocessor.(*shard).processItem
otel-collector-1  |     go.opentelemetry.io/collector/processor/batchprocessor@v0.90.1/batch_processor.go:230
otel-collector-1  | go.opentelemetry.io/collector/processor/batchprocessor.(*shard).start
otel-collector-1  |     go.opentelemetry.io/collector/processor/batchprocessor@v0.90.1/batch_processor.go:215
```

## Notes

- **Do not commit the `.env` file once you've added your secrets.** Add it to your `.gitignore`.
