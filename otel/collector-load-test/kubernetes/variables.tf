variable "aws_region" {
  description = "AWS region for the EKS cluster"
  default     = "us-west-2"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  default     = "my-eks-cluster"
  type        = string
}

variable "cluster_version" {
  description = "Version of the EKS cluster"
  default     = "1.28"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet IDs for the EKS cluster"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnet IDs for the EKS cluster"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for the EKS cluster"
  type        = string
}

variable "registry_name" {
  description = "Registry for the collector-load-test image"
  type        = string
}

variable "repository_name" {
  description = "Repository for the collector-load-test image"
  type        = string
}

variable "runtime" {
  description = "Runtime for the collector-load-test app"
  type        = string
}

variable "owner" {
  description = "New Relic username"
  type        = string
}

variable "reason" {
  description = "case #00123456"
  type        = string
}

variable "description" {
  description = "What is the purpose?"
  type        = string
}

variable "NEW_RELIC_LICENSE_KEY" {
  description = "Your New Relic license (ingest) key"
  type        = string
}

variable "NEW_RELIC_OTLP_ENDPOINT" {
  description = "The New Relic OTLP endpoint"
  type        = string
  default     = "https://otlp.nr-data.net"
}

variable "COLLECTOR_CONFIG" {
  description = "The collector config file name"
  type        = string
  default     = "collector.yaml"
}
