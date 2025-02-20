provider "aws" {
  region = "us-east-2"
}

variable "new_relic_license_key" {
  description = "40-character hexadecimal string"
  type        = string
}

variable "new_relic_datacenter" {
  description = "EU keys are prefixed with eu0x, US otherwise"
  type        = string
  default     = "US"
}

variable "firehose_stream_name" {
  description = "Name of new Kinesis Firehose Delivery Stream"
  type        = string
  default     = "NewRelic-Delivery-Stream"
}

variable "cloudwatch_metric_stream_name" {
  description = "Name of new CloudWatch Metric Stream"
  type        = string
  default     = "NewRelic-Metric-Stream"
}

variable "s3_backup_bucket_name" {
  description = "S3 Bucket Destination for failed events"
  type        = string
  default     = "firehose-backup"
}

variable "create_config_service" {
  description = "Enable and configure AWS Config"
  type        = bool
  default     = false
}

variable "s3_config_bucket_name" {
  description = "S3 Bucket Destination for delivery channel configuration"
  type        = string
  default     = "config-backup"
}

locals {
  new_relic_datacenter_url = {
    US = "https://aws-api.newrelic.com/cloudwatch-metrics/v1"
    EU = "https://aws-api.eu01.nr-data.net/cloudwatch-metrics/v1"
  }
}

resource "aws_s3_bucket" "s3_firehose_events_bucket" {
  bucket = "${var.s3_backup_bucket_name}-${random_id.stack_id.hex}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "s3_firehose_events_bucket_public_access_block" {
  bucket = aws_s3_bucket.s3_firehose_events_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "firehose_role" {
  name = "FirehoseRole-${random_id.stack_id.hex}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "firehose.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "firehose_s3_access_policy" {
  name = "Firehose-S3Access"
  role = aws_iam_role.firehose_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:PutObject"
      ]
      Resource = [
        aws_s3_bucket.s3_firehose_events_bucket.arn,
        "${aws_s3_bucket.s3_firehose_events_bucket.arn}/*"
      ]
    }]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "firehose_stream_to_new_relic" {
  name = var.firehose_stream_name
  destination = "http_endpoint"

  http_endpoint_configuration {
    url            = local.new_relic_datacenter_url[var.new_relic_datacenter]
    access_key     = var.new_relic_license_key
    buffering_size = 1
    buffering_interval = 60
    role_arn       = aws_iam_role.firehose_role.arn

    s3_configuration {
      role_arn     = aws_iam_role.firehose_role.arn
      bucket_arn   = aws_s3_bucket.s3_firehose_events_bucket.arn
      compression_format = "GZIP"
    }

    retry_duration = 60
  }
}

resource "aws_iam_role" "metric_stream_role" {
  name = "MetricsStreamRole-${random_id.stack_id.hex}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "streams.metrics.cloudwatch.amazonaws.com"
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "sts:ExternalId" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })
}
