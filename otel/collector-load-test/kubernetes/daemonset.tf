resource "kubernetes_daemonset" "collector_load_test" {
  metadata {
    name      = var.repository_name
    namespace = kubernetes_namespace.otel.metadata[0].name
  }

  spec {
    selector {
      match_labels = {
        app = var.repository_name
      }
    }

    template {
      metadata {
        labels = {
          app = var.repository_name
        }
      }

      spec {
        container {
          image = "${var.registry_name}/${var.repository_name}:latest"
          name  = var.repository_name

          env {
            name  = "OTEL_SERVICE_NAME"
            value = var.repository_name
          }

          env {
            name  = "OTEL_LOGS_EXPORTER"
            value = "debug"
          }

          env {
            name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
            value = "http://otel-opentelemetry-collector:4317"
          }

          env {
            name  = "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE"
            value = "delta"
          }

          env {
            name  = "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT"
            value = 4095
          }
        }
      }
    }
  }
}
