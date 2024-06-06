using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace HelloWorld
{

  public class Function
  {

    private static readonly HttpClient client = new HttpClient();

    private static async Task<string> GetCallingIP()
    {
      client.DefaultRequestHeaders.Accept.Clear();
      client.DefaultRequestHeaders.Add("User-Agent", "AWS Lambda .Net Client");

      var msg = await client.GetStringAsync("http://checkip.amazonaws.com/").ConfigureAwait(continueOnCapturedContext: false);

      return msg.Replace("\n", "");
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest apigProxyEvent, ILambdaContext context)
    {
      context.Logger.LogLine("FunctionHandler invoked");

      string location = null;
      try
      {
        location = await GetCallingIP();
        context.Logger.LogLine($"Retrieved IP: {location}");
      }
      catch (HttpRequestException httpEx)
      {
        context.Logger.LogLine($"Error retrieving IP: {httpEx.Message}");
      }
      catch (Exception ex)
      {
        context.Logger.LogLine($"Unexpected error: {ex.Message}");
        // Optionally, you can decide to return a different status code here if the IP retrieval is critical
      }

      var body = new Dictionary<string, string>
    {
        { "message", "hello world" },
        { "location", location ?? "Unavailable" }
    };

      var response = new APIGatewayProxyResponse
      {
        Body = JsonSerializer.Serialize(body),
        StatusCode = 200,
        Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
      };

      context.Logger.LogLine("Response generated");

      return response;
    }
  }
}
