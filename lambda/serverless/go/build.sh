#!/bin/bash
echo "Building stand-alone lambda"
docker build -t go-demo-build .
docker run --rm --name go-demo-build-container -d go-demo-build sleep 10 && \
docker cp go-demo-build-container:/build/bootstrap ./bootstrap && \
docker stop go-demo-build-container
