using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Amazon.Lambda.Core;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace ScratchLambda
{
  public class FunctionInput
  {
    public string Message { get; set; }
  }
  public class Function
  {

    public string FunctionHandler(FunctionInput input, ILambdaContext context)
    {
      var message = input?.Message ?? "Hello from Lambda!";
      context.Logger.LogLine($"Processed message: {message}");
      return message.ToUpper();
    }
  }
}