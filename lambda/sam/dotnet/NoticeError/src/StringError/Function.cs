using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace StringError
{
    public class Function
    {
        private static readonly HttpClient client = new HttpClient();

        private static async Task<string> GetCallingIP()
        {
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Add("User-Agent", "AWS Lambda .Net Client");

            var msg = await client.GetStringAsync("http://checkip.amazonaws.com/").ConfigureAwait(continueOnCapturedContext:false);

            return msg.Replace("\n","");
        }

        public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest apigProxyEvent, ILambdaContext context)
        {
            // Log the apigProxyEvent and context to CloudWatch
            var contextInfo = new
            {
                context.FunctionName,
                context.FunctionVersion,
                context.InvokedFunctionArn,
                context.MemoryLimitInMB,
                context.AwsRequestId,
                context.LogGroupName,
                context.LogStreamName
            };

            context.Logger.LogLine("APIGatewayProxyRequest: " + JsonSerializer.Serialize(apigProxyEvent));
            context.Logger.LogLine("LambdaContext: " + JsonSerializer.Serialize(contextInfo));

            // Validate httpMethod and path
            if (string.IsNullOrEmpty(apigProxyEvent.HttpMethod) || string.IsNullOrEmpty(apigProxyEvent.Path))
            {
                throw new ArgumentException("httpMethod and path are required in the APIGatewayProxyRequest");
            }

            // Original function logic
            var location = await GetCallingIP();
            var body = new Dictionary<string, string>
            {
                { "message", "hello world" },
                { "location", location }
            };

            try
            {
                string ImNotABool = "43";
                bool.Parse(ImNotABool);
            }
            catch (Exception ex)
            {
                var errorAttributes = new Dictionary<string, string>() {{"foo", "bar"},{"baz", "luhr"}};
                NewRelic.Api.Agent.NewRelic.NoticeError(ex.Message, errorAttributes);
            }

            return new APIGatewayProxyResponse
            {
                Body = JsonSerializer.Serialize(body),
                StatusCode = 200,
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
            };
        }
    }
}
