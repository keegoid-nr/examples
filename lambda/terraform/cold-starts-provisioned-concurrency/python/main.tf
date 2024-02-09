module "python_test_function" {
  source = "../lambda"
  aws_region = var.aws_region
  lambda_function_handler = "app.lambda_handler"
  wrapper_handler = "newrelic_lambda_wrapper.handler"
  lambda_function_name = var.function_name
  lambda_runtime = "python3.10"
  newrelic_account_id = var.newrelic_account_id
  newrelic_trusted_account_key = var.newrelic_trusted_account_key
  newrelic_license_key_secret = var.newrelic_license_key_secret
  # newrelic_license_key = var.newrelic_license_key
  newrelic_layer = "arn:aws:lambda:${var.aws_region}:451483290750:layer:NewRelicPython310:18"
  log_level = "debug"
  log_path = "stderr"
}
