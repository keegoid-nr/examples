# Kubernetes

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Prerequisites](#prerequisites)
- [Kubernetes Setup](#kubernetes-setup)
- [Components](#components)
  - [main.tf](#maintf)
  - [configmap.tf](#configmaptf)
  - [daemonset.tf](#daemonsettf)
  - [namespace.tf](#namespacetf)
  - [service.tf](#servicetf)
  - [variables.tf](#variablestf)
- [Notes](#notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Prerequisites

- Go 1.21
- Terraform 1.5.7
- AWS CLI 2.11.21

## Kubernetes Setup

This directory contains the config files necessary to run the collector-load-test app and the collector in Kubernetes.

1. Create a `terraform.tfvars` files to store your New Relic license (ingest) key and other variable values.

    ```sh
    NEW_RELIC_LICENSE_KEY   = ""
    aws_region              = "us-west-2"
    cluster_name            = "otel-collector-load-test"
    cluster_version         = "1.28"
    vpc_id                  = ""
    public_subnets          = ["", "", ""]
    private_subnets         = ["", "", ""]
    registry_name           = "123456789876.dkr.ecr.us-west-2.amazonaws.com"
    repository_name         = "collector-load-test"
    runtime                 = "go"
    owner                   = ""
    reason                  = ""
    description             = ""
    ```

2. Run the [build_and_push.sh](build_and_push.sh) script.

    ```sh
    ./build_and_push.sh
    ```

3. Execute Terraform deployment.

  ```sh
  terraform validate .
  terraform plan -out tfplan
  terraform apply "tfplan"
  ```

## Components

### main.tf

Sets the providers, local variables, outputs, and eks module. At the bottom of the file, we describe how to run the [build_and_push.sh](./build_and_push.sh) file passing in the Terraform outputs as inputs to the script.

### configmap.tf

Defines the otel-config.yaml in Kubernetes.

### daemonset.tf

Defines the otel_collector and collector_load_test container spec.

### namespace.tf

Sets the namespace.

### service.tf

Defines the service in the namespace.

### variables.tf

Defines the variables. Values can be set in three ways: interactively on `terraform plan`, as `defaults` in the variable definitions, or in a `terraform.tfvars` file.

## Notes

- **Do not commit the `terraform.tfvars` file once you've added your secrets.** Add it to your `.gitignore`.
- **Endpoint Configuration**: The `OTLPMetricExporter` is configured to send metrics to an OpenTelemetry Collector. Replace `"localhost:4317"` with the address of your collector within the Kubernetes cluster.
- **Metric Generation**: This script uses a simple loop to generate random metric values. You can adjust the frequency and complexity of these metrics based on your testing needs.
- **Kubernetes Deployment**: When deploying this application in Kubernetes, we package it in a container and define the necessary Kubernetes resources (like a DaemonSet) for its deployment.
