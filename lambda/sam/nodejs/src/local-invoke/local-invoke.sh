#!/bin/bash

accountId="$1"
region="$2"
licenseKey="$3"

echo "region set to ${region}"

sam build #--use-container

sam local invoke kmullaneyextensiononlylayersam \
  --event events/event.json \
	--parameter-overrides "NRAccountId=${accountId}" \
  --parameter-overrides "NRLicenseKey=${licenseKey}"
