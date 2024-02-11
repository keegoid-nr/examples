resource "kubernetes_service" "collector_load_test" {
  metadata {
    name = var.repository_name
    namespace = kubernetes_namespace.otel.metadata[0].name
  }

  spec {
    selector = {
      app = var.repository_name
    }

    type = "ClusterIP"
  }
}
