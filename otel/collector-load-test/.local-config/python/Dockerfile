# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the app into the container at /usr/src/app
COPY collector-load-test.py .

# Install any needed packages specified in requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The ENTRYPOINT can be dynamically set via the build_and_push.sh script
ENTRYPOINT python collector-load-test.py
