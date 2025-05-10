# TLS and HTTP Connection Checker

## Description

`TlsChecker` is a simple Java utility designed to test TLS/SSL connectivity to a specified HTTPS server. It establishes a connection, displays the negotiated TLS cipher suite, the HTTP response code from the server, and then attempts to print the server's response body.

This tool is particularly useful for diagnosing connectivity issues and distinguishing between:

1. Failures during the TLS handshake itself.
2. HTTP-level errors that occur *after* a successful TLS handshake.

## Original Purpose / Problem Encountered

This utility was enhanced during the process of troubleshooting a connection to an API endpoint (`log-api.newrelic.com`). Initial debugging logs suggested a connection failure after what appeared to be a successful TLS handshake. Further investigation, aided by refining this tool, revealed that the TLS handshake was indeed completing successfully. The actual issue was an HTTP 403 (Forbidden) error returned by the server due to a missing API key. This tool helps clarify such scenarios by explicitly reporting the HTTP status code and response body.

## Features

* Establishes an HTTPS connection to a predefined host (currently `log-api.newrelic.com`, easily modifiable).
* Displays the TLS cipher suite negotiated for the connection.
* Retrieves and displays the HTTP status code returned by the server.
* Prints the server's response body, whether it's a successful response (e.g., HTML, JSON) or an error message.
* Provides clear differentiation between TLS setup and HTTP request phases.
* Supports standard Java TLS debugging options (e.g., `-Djavax.net.debug=ssl:handshake`).

## Prerequisites

* Java Development Kit (JDK) version 8 or higher installed and configured.

## How to Compile

Navigate to the directory containing `TlsChecker.java` and run:

```bash
javac TlsChecker.java
```

## How to Run

After successful compilation, run the program using:

```bash
java TlsChecker
```

### Running with TLS Debugging

To get detailed information about the TLS handshake process, you can use the `javax.net.debug` system property:

* For handshake details:

    ```bash
    java -Djavax.net.debug=ssl:handshake TlsChecker
    ```

* For all SSL/TLS related debugging information (very verbose):

    ```bash
    java -Djavax.net.debug=all TlsChecker
    ```

## Code Overview

The `TlsChecker.java` program performs the following steps:

1. **Initialization**: Sets the target `host` and constructs the `urlString`.
2. **Connection Setup**:
    * Creates a `URL` object.
    * Opens an `HttpsURLConnection` from the URL.
    * Sets connection and read timeouts.
3. **Connection Attempt**:
    * Calls `connection.getResponseCode()`. This implicitly:
        * Resolves the DNS for the host.
        * Establishes a TCP connection.
        * Performs the TLS handshake.
        * Sends an HTTP GET request.
        * Receives the HTTP status line and headers.
    * Calls `connection.getCipherSuite()` to retrieve the negotiated cipher.
4. **Outputting Connection Details**: Prints the cipher suite and HTTP response code.
5. **Handling HTTP Response**:
    * If the HTTP response code indicates success (200-299), it reads from `connection.getInputStream()`.
    * If the HTTP response code indicates an error, it reads from `connection.getErrorStream()` to capture the server's error message.
    * The response body is printed to the console.
6. **Cleanup**: The connection is disconnected.
7. **Exception Handling**: A `try-catch` block is used to report any exceptions that occur during the process, such as `SSLException` (if the handshake fails) or other `IOExceptions`.

## Example Output

Connecting to an API requiring authentication (e.g., `log-api.newrelic.com` without an API key)

```
Attempting to connect to [https://log-api.newrelic.com](https://log-api.newrelic.com)
TLS connection established.
Cipher Suite: TLS_AES_128_GCM_SHA256
HTTP Response Code: 403
HTTP request failed with response code: 403
Server response content:
{"error":"Missing API key. Please see [https://docs.newrelic.com](https://docs.newrelic.com)"}
```

*(The Cipher Suite may vary based on the server and client capabilities)*

---
Generated on: May 9, 2025
