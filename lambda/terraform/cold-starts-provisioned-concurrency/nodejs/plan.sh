#!/bin/bash
accountId=$1
region=$2
export TF_VAR_newrelic_account_id=$accountId
export TF_VAR_newrelic_trusted_account_key=$accountId
export TF_VAR_aws_region=$region
echo "region set to ${region}"
rm -f function.zip
zip -rq function.zip app.js
terraform validate .
terraform plan -out "tfplan"
