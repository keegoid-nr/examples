#!/bin/bash

region="${1}"
bucket="${2}-${region}"

echo "region set to ${region}"
echo "bucket set to ${bucket}"

sam build --use-container
aws s3 mb --region "${region}" "s3://${bucket}"
sam package --region "${region}" --s3-bucket "${bucket}" --output-template-file packaged.yaml --debug
sam deploy --template-file packaged.yaml --stack-name "${bucket}"
