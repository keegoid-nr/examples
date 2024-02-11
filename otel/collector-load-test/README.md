# OTel Load Test

## Components

- [docker](./docker/README.md) - Utilizes `docker compose` to create two containers: `docker-collector-load-test-1` and `docker-otel-collector-1`.
- [kubernetes](./kubernetes/README.md) - Creates a cluster in EKS and deploys the collector and Go app as daemonsets.
- [go](./go/README.md) - Generates random metrics and sends them to the collector.
