import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class TlsChecker {
    public static void main(String[] args) {
        String host = "log-api.newrelic.com";
        int port = 443; // Default HTTPS port, often not needed in URL if standard
        String urlString = "https://" + host; // Port 443 is implicit for https

        try {
            URL url = new URL(urlString);
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            connection.setConnectTimeout(10000); // 10 seconds
            connection.setReadTimeout(10000);    // 10 seconds

            System.out.println("Attempting to connect to " + urlString);

            // Trigger the TLS handshake by getting the response code
            int responseCode = connection.getResponseCode();
            String cipherSuite = connection.getCipherSuite(); // Get this after connection is established

            System.out.println("TLS connection established.");
            System.out.println("Cipher Suite: " + cipherSuite);
            System.out.println("HTTP Response Code: " + responseCode);
            // The TLS version will be visible in the debug output with -Djavax.net.debug=ssl:handshake

            InputStream inputStream;
            if (responseCode >= 200 && responseCode < 300) {
                // Successful HTTP response
                System.out.println("HTTP request successful.");
                inputStream = connection.getInputStream();
            } else {
                // HTTP error response
                System.err.println("HTTP request failed with response code: " + responseCode);
                inputStream = connection.getErrorStream(); // Get error stream to see server's error message
            }

            if (inputStream != null) {
                System.out.println("Server response content:");
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        System.out.println(line);
                    }
                }
                inputStream.close();
            }

            connection.disconnect();

        } catch (Exception e) {
            // This will catch SSL handshake exceptions or other network issues
            System.err.println("Error during TLS/HTTP connection to " + urlString + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}