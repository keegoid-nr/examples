#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <region> [example]"
  echo ""
  echo "Examples:"
  echo "  $0 us-west-2 esm"
  echo "  $0 us-west-2 extension-only"
  echo "  $0 us-west-2 record-metric"
  echo "  $0 us-west-2 default"
  echo "  $0 us-west-2 aws-sdk-issue"
  echo "  $0 us-west-2 no-outbound-vpc"
  echo "  $0 us-west-2 dt-incoming"
  exit 1
fi

region="$1"
example="${2:-}"
script_dir="$(cd "$(dirname "$0")" && pwd)"
config_file="${script_dir}/samconfig.toml"

if [ -n "$example" ]; then
  src_dir="$(dirname "$0")/src/${example}"
  if [ ! -d "$src_dir" ]; then
    echo "Error: example '${example}' not found in src/"
    exit 1
  fi
  if [ ! -f "${src_dir}/template.yaml" ]; then
    echo "Error: no template.yaml found in src/${example}/"
    exit 1
  fi
  cd "$src_dir"
fi

bucket=$(echo "$USER-$(basename "$PWD")-$region" | tr '[:upper:]' '[:lower:]')

echo "region:  ${region}"
echo "example: $(basename "$PWD")"
echo "bucket:  ${bucket}"

if ! aws s3 ls "s3://${bucket}" --region "${region}" > /dev/null 2>&1; then
  echo "Creating S3 bucket: ${bucket}"
  aws s3 mb "s3://${bucket}" --region "${region}"
else
  echo "S3 bucket ${bucket} already exists."
fi

sam build --use-container --region "${region}"
sam deploy --region "${region}" --stack-name "${bucket}" --s3-bucket "${bucket}" --capabilities CAPABILITY_IAM --config-file "${config_file}"

echo "Deployment complete."
