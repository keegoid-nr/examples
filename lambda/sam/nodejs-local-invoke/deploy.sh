#!/bin/bash

accountId="$1"
region="$2"
licenseKey="$3"

echo "region set to ${region}"

sam build #--use-container

bucket="kmullaney-demo-${region}-${accountId}"

aws s3 mb --region "${region}" "s3://${bucket}"

sam package --region "${region}" --s3-bucket "${bucket}" --output-template-file packaged.yaml

aws cloudformation deploy \
	--region "${region}" \
	--template-file packaged.yaml \
	--stack-name "${bucket}" \
	--capabilities CAPABILITY_IAM \
	--parameter-overrides "NRAccountId=${accountId}" \
  --parameter-overrides "NRLicenseKey=${licenseKey}"
