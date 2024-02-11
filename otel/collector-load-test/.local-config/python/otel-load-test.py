# ------------------------------------------------------
# Generate random metrics to load test OTel collector.
#
# Author : Keegan Mullaney
# Company: New Relic
# Website: github.com/keegoid-nr/collector-load-test
# License: Apache 2.0
# ------------------------------------------------------

import random
import time
import signal
import logging
from typing import Dict, Union, Iterable
from opentelemetry.metrics import (
    CallbackOptions,
    Observation,
    get_meter_provider,
    set_meter_provider,
)
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
    OTLPMetricExporter,
)
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

meter_name = "github.com/keegoid-nr/collector-load-test"

def main():
    logging.basicConfig(level=logging.INFO)
    logging.info("Application is starting...")

    # Create a Meter Provider with custom aggregation selector
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: "collector-load-test",
        ResourceAttributes.SERVICE_VERSION: "0.1.0",
        ResourceAttributes.SERVICE_INSTANCE_ID: "python-app-1",
    })

    # Configure OTLP Exporter
    exporter = OTLPMetricExporter(insecure=True)

    # Create a periodic reader
    reader = PeriodicExportingMetricReader(exporter, export_interval_millis=5000)

    # Create a meter
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    set_meter_provider(provider)

    meter = get_meter_provider().get_meter(meter_name)

    # Start metric generation
    generate_metrics(meter)

    # Handle interrupts
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Keep the main thread alive
    while True:
        time.sleep(1)

def generate_metrics(meter):
    # request counter
    http_requests_counter = meter.create_counter(
        "http_count",
        description="count of HTTP requests",
        unit="1"
    )

    # error rate gauge
    error_rate_gauge = meter.create_observable_gauge(
        "error_rate",
        [lambda options: observable_gauge_func(options, labels)],
        description="rate of status_code errors",
        unit="1"
    )

    # methods and status codes
    http_methods = ["GET", "POST", "PUT", "DELETE"]
    status_codes = [200, 201, 202, 204, 400, 401, 403, 404, 500, 502, 503, 504]

    # metric generation loop
    while True:
        status_code_weights = generate_status_code_weights(status_codes)
        # logging.info(f"Status Code Weights: {[round(w, 6) for w in status_code_weights]}")

        method = random.choice(http_methods)
        status_code = weighted_choice(status_codes, status_code_weights)
        # logging.info(f"Chosen Status Code: {status_code}")

        value = random.randint(1, 1_000)

        labels = {
            "http.method": method,
            "http.status_code": status_code,
            "http.server.duration": value
        }

        http_requests_counter.add(1, labels)

        if status_code > 204:
            chosen_weight = status_code_weights[find_index(status_codes, status_code)]
            logging.info(f"Status Code Weights: {[round(w, 6) for w in status_code_weights]}")
            logging.info(f"Chosen Status Code: {status_code}")
            logging.info(f"Chosen Weight: {round(chosen_weight, 6)}")
            global chosen_weight_global
            chosen_weight_global = chosen_weight

        sleep_duration = random.uniform(0.01, 0.1)  # 10 to 100 milliseconds
        time.sleep(sleep_duration)

def observable_gauge_func(options: CallbackOptions, labels: Dict[str, Union[str, int]]) -> Iterable[Observation]:
    yield Observation(chosen_weight_global, labels)

# def error_rate_callback(observable_gauge):
#     observable_gauge.observe(chosen_weight_global, {"error": "true"})

def generate_status_code_weights(status_codes):
    first_status_code_weight = 0.95
    remaining_probability = 1.0 - first_status_code_weight
    other_status_code_weights = [random.random() for _ in range(len(status_codes) - 1)]
    total_weight = sum(other_status_code_weights)

    # Normalize the other weights
    other_status_code_weights = [w / total_weight * remaining_probability for w in other_status_code_weights]

    return [first_status_code_weight] + other_status_code_weights

def weighted_choice(choices, weights):
    total = sum(weights)
    r = random.uniform(0, total)
    upto = 0
    for c, w in zip(choices, weights):
        if upto + w >= r:
            return c
        upto += w
    return choices[-1]  # Fallback in case of rounding issues

def find_index(arr, target):
    for i, v in enumerate(arr):
        if v == target:
            return i
    return -1

def signal_handler(sig, frame):
    logging.info("SIGINT received. Gracefully stopping the application...")
    exit(0)

if __name__ == "__main__":
    main()
