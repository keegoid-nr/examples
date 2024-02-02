console.log("Lambda Handler starting up")

exports.handler = (event, context) => {
  console.log("Hello world!")
  return "success"
}
