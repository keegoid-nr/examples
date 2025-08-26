#!/bin/bash

# Ensure the script stops if there's an error
set -e

# Check if the region is supplied
if [ -z "$1" ]; then
  echo "Usage: $0 <region>"
  exit 1
fi

region="$1"
bucket=$(echo "$USER-$(basename "$PWD")-$region" | tr '[:upper:]' '[:lower:]')

echo "region set to ${region}"
echo "bucket set to ${bucket}"

# Check if the S3 bucket exists and create it if it doesn't
if ! aws s3 ls "s3://${bucket}" --region "${region}" > /dev/null 2>&1; then
  echo "Creating S3 bucket: ${bucket}"
  aws s3 mb "s3://${bucket}" --region "${region}"
else
  echo "S3 bucket ${bucket} already exists."
fi

sam build --use-container --region "${region}"
sam package --region "${region}" --s3-bucket "${bucket}" --output-template-file packaged.yaml #--debug
sam deploy --region "${region}" --stack-name "${bucket}" --capabilities CAPABILITY_IAM --template-file packaged.yaml #--debug

echo "Deployment complete."
