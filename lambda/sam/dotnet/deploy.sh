#!/bin/bash

region="$1"
bucket="$USER-$(basename "$PWD")-$region"

echo "region set to ${region}"
echo "bucket set to ${bucket}"

sam build --use-container --mount-with WRITE
aws s3 mb --region "${region}" "s3://${bucket}"
sam package --region "${region}" --s3-bucket "${bucket}" --output-template-file packaged.yaml --debug
sam deploy --template-file packaged.yaml --stack-name "${bucket}" # --debug
