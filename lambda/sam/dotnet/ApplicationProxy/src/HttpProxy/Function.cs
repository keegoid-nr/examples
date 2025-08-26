using System.Text.Json;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace HttpProxy;

public class Function
{
    // A single HttpClient instance is created and reused for the lifetime of the function.
    // In the Lambda execution environment, the .NET runtime automatically configures this
    // HttpClient to use the proxy settings defined in the HTTPS_PROXY environment variable.
    private static readonly HttpClient httpClient = new HttpClient();

    /// <summary>
    /// A function that demonstrates making an outbound web request through an HTTP proxy.
    /// It calls an external service to discover its public IP address.
    /// </summary>
    /// <param name="apiGatewayProxyRequest">The request from API Gateway.</param>
    /// <param name="context">The Lambda execution context.</param>
    /// <returns>An API Gateway response containing the public IP of the proxy.</returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest apiGatewayProxyRequest, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Making a request to https://api.ipify.org to find our public IP...");

            // This request will be sent to the HTTP proxy defined in the `HTTPS_PROXY`
            // environment variable in the template.yaml file. The proxy will then forward
            // the request to the internet.
            var publicIp = await httpClient.GetStringAsync("https://api.ipify.org");

            context.Logger.LogInformation($"Successfully received response. Public IP is: {publicIp}");

            var responseBody = new
            {
                message = "Successfully called external service through the HTTP proxy.",
                publicIpOfProxy = publicIp.Trim()
            };

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Body = JsonSerializer.Serialize(responseBody),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error making outbound request: {ex.Message}");
            context.Logger.LogError(ex.ToString());
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = JsonSerializer.Serialize(new { message = "An error occurred while trying to contact the external service via the proxy.", error = ex.Message }),
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }
}
