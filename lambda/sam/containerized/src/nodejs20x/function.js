exports.handler = async (event) => {
  let responseMessage = "Hello, World from Node.js 20 Lambda!"

  // Check if there is a name present in queryParameters
  if (event.queryStringParameters && event.queryStringParameters.name) {
    responseMessage = `Hello, ${event.queryStringParameters.name} from Node.js 20 Lambda!`
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: responseMessage }),
  }

  return response
}
