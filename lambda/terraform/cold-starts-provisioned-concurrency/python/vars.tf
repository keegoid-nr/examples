variable "function_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "newrelic_account_id" {
  type = string
}

variable "newrelic_trusted_account_key" {
  type = string
}

variable "newrelic_license_key_secret" {
  description = "New Relic license key secret for the Lambda"
  type = string
}

# variable "newrelic_license_key" {
#   description = "New Relic license key for the Lambda"
#   type = string
# }
