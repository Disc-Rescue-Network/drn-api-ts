#!/bin/bash

PROCESS_NAME="drn-apis"
URL="http://localhost:8080/health-check"
DELAY=3                                     # Delay in seconds before making the HTTP request
EXPECTED_STATUS=200                         # The expected HTTP status code
CURL_OUTPUT="curl_output.txt"               # Temporary file to store curl output

pm2 startOrReload ecosystem.config.js
if [ $? -ne 0 ]; then
  echo "Failed to start process $PROCESS_NAME"
  exit 1
fi
echo "Started process $PROCESS_NAME, waiting for $DELAY seconds..."

# Wait for the specified delay
sleep $DELAY

echo "Making HTTP request to $URL..."
curl -o /dev/null -s -w "%{http_code}" $URL > $CURL_OUTPUT

# Get the HTTP status code
HTTP_STATUS=$(tail -n1 $CURL_OUTPUT)

if [ "$HTTP_STATUS" -ne "$EXPECTED_STATUS" ]; then
  echo "HTTP request failed with status: $HTTP_STATUS. Stopping PM2 process $PROCESS_NAME..."

  # Stop the PM2 process if failure
  pm2 stop $PROCESS_NAME
else
  echo "HTTP request successful with status: $HTTP_STATUS. Process is running fine."
fi

rm $CURL_OUTPUT
