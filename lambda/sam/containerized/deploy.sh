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

# Login to ECR
# Extract account ID from the image repository URL if needed, or assume current account
# Here assuming the user is logged into the correct AWS account for the registry
aws ecr get-login-password --region "${region}" | docker login --username AWS --password-stdin 368927449855.dkr.ecr.us-west-2.amazonaws.com

# Build the application
# --use-container is generally good for native dependencies, but with Image package type, 
# sam build works by building the docker image directly.
sam build --region "${region}"

# Deploy
# Using samconfig.toml for parameters (image_repository, etc.)
# We remove specific flags that might conflict or be redundant if they are in samconfig.toml,
# but keeping critical ones like --stack-name if user wants dynamic naming based on bucket/user.
# However, user's samconfig has defaults. 
# The script calculates `bucket` and uses it as stack name.
sam deploy --region "${region}" --stack-name "${bucket}" --capabilities CAPABILITY_IAM

echo "Deployment complete."
