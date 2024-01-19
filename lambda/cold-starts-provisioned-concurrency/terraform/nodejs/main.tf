module "nodejs_test_function" {
  source = "../lambda"
  aws_region = var.aws_region
  lambda_function_handler = "app.lambda_handler"
  wrapper_handler = "newrelic-lambda-wrapper.handler"
  lambda_function_name = var.function_name
  lambda_runtime = "nodejs18.x"
  newrelic_account_id = var.newrelic_account_id
  newrelic_trusted_account_key = var.newrelic_trusted_account_key
  newrelic_license_key_secret = var.newrelic_license_key_secret
  # newrelic_license_key = var.newrelic_license_key
  newrelic_layer = "arn:aws:lambda:${var.aws_region}:451483290750:layer:NewRelicNodeJS18X:55"
}
