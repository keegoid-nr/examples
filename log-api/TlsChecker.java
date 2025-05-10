import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Date; // For unique message

public class TlsChecker {
    public static void main(String[] args) {

        // --- Configuration ---
        String apiKey = System.getenv("NEW_RELIC_LICENSE_KEY");

        // Define New Relic Log API base URL (change if using EU or other region)
        String baseLogApiUrl = "https://log-api.newrelic.com";
        // For EU region: String baseLogApiUrl = "https://log-api.eu.newrelic.com";
        // --- End Configuration ---

        String urlString;
        boolean performPost;

        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.out.println("INFO: NEW_RELIC_LICENSE_KEY environment variable not set or is empty.");
            System.out.println("Performing a GET request to test TLS handshake only.");
            // For a GET test, we can target the base URL or a known simple endpoint.
            // The /log/v1 endpoint will likely return 401/403 on a GET without auth,
            // but the TLS handshake will still be tested.
            urlString = baseLogApiUrl + "/log/v1";
            performPost = false;
        } else {
            System.out.println("INFO: NEW_RELIC_LICENSE_KEY found. Performing POST request to send logs.");
            urlString = baseLogApiUrl + "/log/v1";
            performPost = true;
        }

        try {
            URL url = new URL(urlString);
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();

            // Set timeouts
            connection.setConnectTimeout(10000); // 10 seconds
            connection.setReadTimeout(10000);    // 10 seconds

            if (performPost) {
                // --- Setup for POST request ---
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Api-Key", apiKey);
                connection.setDoOutput(true); // Important for POST requests

                // Get JDK version, java executable path, and hostname
                String jdkVersion = System.getProperty("java.version", "unknown");
                String javaHome = System.getProperty("java.home", "unknown");
                String javaExecutableName = "java";
                if (System.getProperty("os.name", "").toLowerCase().startsWith("windows")) {
                    javaExecutableName = "java.exe";
                }
                String javaExecutablePath = javaHome + File.separator + "bin" + File.separator + javaExecutableName;

                String hostname;
                try {
                    hostname = InetAddress.getLocalHost().getHostName();
                } catch (UnknownHostException e) {
                    hostname = "unknown";
                    System.err.println("Warning: Could not determine hostname - " + e.getMessage());
                }

                // Construct the JSON payload
                long timestamp = System.currentTimeMillis();
                String jsonPayload = String.format(
                    "[{" +
                    "  \"message\": \"This is a test log message from TlsChecker.java on %s\"," +
                    "  \"timestamp\": %d," +
                    "  \"attributes\": {" +
                    "    \"service\": \"TlsChecker.java\"," +
                    "    \"logtype\": \"test\"," +
                    "    \"level\": \"info\"," +
                    "    \"hostname\": \"%s\"," +
                    "    \"plugin.source\": \"%s\"," +
                    "    \"plugin.version\": \"%s\"" +
                    "  }" +
                    "}]",
                    new Date().toString(), // For unique message content
                    timestamp,
                    hostname,
                    javaExecutablePath,
                    jdkVersion
                );

                System.out.println("Attempting to POST to: " + urlString);
                System.out.println("Payload: " + jsonPayload);

                // Send the payload
                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
            } else {
                // --- Setup for GET request ---
                connection.setRequestMethod("GET");
                // No specific headers like Api-Key or Content-Type needed for this GET test
                // connection.setDoOutput(false); // Default for GET
                System.out.println("Attempting a GET request to: " + urlString);
            }

            // --- Common logic for getting response ---
            // This triggers the actual connection if not already done
            int responseCode = connection.getResponseCode();
            String httpMethod = connection.getRequestMethod();
            String cipherSuite = "";

            try {
                 cipherSuite = connection.getCipherSuite();
            } catch (IllegalStateException e) {
                // This can happen if the connection failed very early
                System.err.println("Could not get cipher suite (connection likely not fully established before error): " + e.getMessage());
            }

            System.out.println("TLS connection established.");
            if (cipherSuite != null && !cipherSuite.isEmpty()) {
                System.out.println("Cipher Suite: " + cipherSuite);
            }
            System.out.println("HTTP Method: " + httpMethod);
            System.out.println("HTTP Response Code: " + responseCode);

            InputStream inputStream;
            if (responseCode >= 200 && responseCode < 300) {
                // For POST, New Relic typically returns 202 Accepted.
                // For GET (to /log/v1 without auth), it might be an error code, but this block handles success.
                System.out.println("HTTP " + httpMethod + " request successful or accepted.");
                inputStream = connection.getInputStream();
            } else {
                System.err.println("HTTP " + httpMethod + " request failed with response code: " + responseCode + " (" + connection.getResponseMessage() + ")");
                inputStream = connection.getErrorStream();
            }

            if (inputStream != null) {
                System.out.println("Server response content:");
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        System.out.println(line);
                    }
                }
            } else {
                System.out.println("No response content from server.");
            }

            connection.disconnect();

        } catch (Exception e) {
            System.err.println("Error during TLS/HTTP connection to " + urlString + ": " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}