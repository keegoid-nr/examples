# TLS and HTTP Connection Checker for New Relic

## Description

`TlsChecker` is a Java utility designed to test TLS/SSL connectivity and optionally send sample log data to the New Relic Log API. It helps diagnose connection issues by clearly distinguishing between TLS handshake problems and HTTP-level errors.

The tool operates in two modes based on the presence of the `NEW_RELIC_LICENSE_KEY` environment variable:

1. **TLS Test Mode (GET):** If the `NEW_RELIC_LICENSE_KEY` environment variable is not set or is empty, the tool performs a GET request to the New Relic API endpoint. This mode primarily tests the TLS handshake and basic HTTP connectivity without attempting to authenticate or send data.
2. **Log Sending Mode (POST):** If the `NEW_RELIC_LICENSE_KEY` environment variable is set, the tool constructs and sends a sample log payload via a POST request to the New Relic Log API. This tests the full path, including authentication and data ingestion.

In both modes, the utility displays the negotiated TLS cipher suite and the HTTP response code. When sending logs, the JSON payload includes dynamic attributes such as the path to the Java executable (`plugin.source`) and the current JDK version (`plugin.version`).

## Original Purpose / Problem Encountered

This utility was initially developed to help differentiate between failures during the TLS handshake and HTTP-level errors occurring over an established TLS connection. It has since evolved to also serve as a basic New Relic log submission test tool, adapting its behavior based on the availability of an API key, and providing more context in the submitted logs.

## Features

* Establishes an HTTPS connection to the New Relic Log API.
* **Conditional Operation:**
  * Performs a GET request for TLS handshake and basic connectivity testing if `NEW_RELIC_LICENSE_KEY` is not set.
  * Performs a POST request to send a sample log entry if `NEW_RELIC_LICENSE_KEY` is set.
* **API Key Handling:** Reads the New Relic License Key from the `NEW_RELIC_LICENSE_KEY` environment variable.
* Displays the TLS cipher suite used for the connection.
* Retrieves and displays the HTTP status code and message from the server.
* Prints the server's full response body (for both success and error cases).
* **Dynamic Log Attributes (in POST mode):**
  * `timestamp`: Current epoch milliseconds.
  * `hostname`: Detected hostname of the machine running the tool.
  * `plugin.source`: The filesystem path to the Java executable running the program.
  * `plugin.version`: The version of the JDK running the program.
* Supports standard Java TLS debugging options (e.g., `-Djavax.net.debug=ssl:handshake`).

## Prerequisites

* Java Development Kit (JDK) version 8 or higher installed and configured.
* **For sending logs (POST mode):** The `NEW_RELIC_LICENSE_KEY` environment variable must be set to your New Relic License Key (often an Ingest License Key).

## How to Compile

Navigate to the directory containing `TlsChecker.java` and run:

```bash
javac TlsChecker.java
```

## How to Run

After successful compilation:

* **To run in TLS Test Mode (GET request):**

    Ensure the `NEW_RELIC_LICENSE_KEY` environment variable is *not* set or is empty.

    ```bash
    java TlsChecker
    ```

    *(You will see "INFO: NEW_RELIC_LICENSE_KEY environment variable not set or is empty." in the output.)*

* **To run in Log Sending Mode (POST request):**

    First, set the `NEW_RELIC_LICENSE_KEY` environment variable. Replace `YOUR_ACTUAL_API_KEY` with your valid New Relic Ingest License Key.

  * Linux/macOS:

    ```bash
    export NEW_RELIC_LICENSE_KEY="YOUR_ACTUAL_API_KEY"
    ```

  * Windows (Command Prompt):

    ```bash
    set NEW_RELIC_LICENSE_KEY="YOUR_ACTUAL_API_KEY"
    ```

  * Windows (PowerShell):

    ```bash
    $env:NEW_RELIC_LICENSE_KEY="YOUR_ACTUAL_API_KEY"
    ```

    Then, run the program:

    ```bash
    java TlsChecker
    ```

    *(You will see "INFO: NEW_RELIC_LICENSE_KEY found. Performing POST request..." in the output.)*

* **With detailed TLS handshake debugging (applies to both modes):**

    ```bash
    java -Djavax.net.debug=ssl:handshake TlsChecker
    ```

    For even more verbose output (all SSL/TLS related debugging):

    ```bash
    java -Djavax.net.debug=all TlsChecker
    ```

## Code Overview

1. **API Key Check:** The `main` method starts by reading the `NEW_RELIC_LICENSE_KEY` environment variable.
2. **Mode Selection:** Based on the presence and validity of the API key, it sets a `performPost` boolean flag and determines the target `urlString`.
3. **Connection Setup:** An `HttpsURLConnection` is created and configured with timeouts.
4. **POST Request Logic (if `performPost` is true):**
    * The request method is set to `POST`.
    * `Content-Type: application/json` and `Api-Key` headers are set.
    * `setDoOutput(true)` enables sending a request body.
    * A JSON payload is constructed, including dynamic attributes like `hostname`, `plugin.source` (Java executable path), and `plugin.version` (JDK version).
    * The payload is written to the connection's output stream.
5. **GET Request Logic (if `performPost` is false):**
    * The request method is set to `GET`. No special headers or payload are needed for this mode.
6. **Response Handling (Common Logic):**
    * The HTTP response code and message are retrieved.
    * The negotiated TLS cipher suite is obtained and printed.
    * The server's response body is read from either the input stream (for success codes 200-299) or the error stream (for other codes) and printed.
7. **Cleanup:** The connection is disconnected.
8. **Exception Handling:** Catches and prints details of any exceptions during the process.

## Example Output

### Scenario 1: TLS Test Mode (GET - `NEW_RELIC_LICENSE_KEY` not set)

```
INFO: NEW_RELIC_LICENSE_KEY environment variable not set or is empty.
Performing a GET request to test TLS handshake only.
Attempting a GET request to: [https://log-api.newrelic.com/log/v1](https://log-api.newrelic.com/log/v1)
TLS connection established.
Cipher Suite: TLS_AES_256_GCM_SHA384
HTTP Method: GET
HTTP Response Code: 403
HTTP GET request failed with response code: 403 (Forbidden)
Server response content:
{}
```

*(Cipher suite and exact error details from New Relic may vary. The key takeaway is that the TLS handshake occurred, followed by an expected HTTP error due to missing authentication.)*

### Scenario 2: Log Sending Mode (POST - `NEW_RELIC_LICENSE_KEY` is set)

```
INFO: NEW_RELIC_LICENSE_KEY found. Performing POST request to send logs.
Attempting to POST to: [https://log-api.newrelic.com/log/v1](https://log-api.newrelic.com/log/v1)
Payload: [{"message": "This is a test log message from TlsChecker.java on Fri May 09 22:00:37 PDT 2025","timestamp": 1746882037000,"attributes": {"service": "my-java-test-service","logtype": "my-java-test-log-type","source": "TlsChecker.java","hostname": "my-dev-machine","plugin.source": "/opt/jdk/jdk-11.0.12/bin/java","plugin.version": "11.0.12"}}]
TLS connection established.
Cipher Suite: TLS_AES_256_GCM_SHA384
HTTP Method: POST
HTTP Response Code: 202
HTTP POST request successful or accepted.
Server response content:
{"requestId":"458edff8-0001-b4a0-f173-0196b896be05"}
```

*(Exact values for timestamp, hostname, paths, versions, cipher suite, and `requestId` will differ based on your environment and the time of execution.)*

---
*This README was last updated to reflect code changes as of May 9, 2025.*
