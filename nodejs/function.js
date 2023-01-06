var fs = require("fs")

// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

module.exports.lambda_handler = async function (event, context) {
  var files = fs.readdirSync("/opt/nodejs/")
  var packageLock = fs.readFileSync("/opt/nodejs/package-lock.json").toString()

  // do work
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  console.warn("Event not processed.")
  console.log(files)
  console.log("***package-lock.json***\n", packageLock)

  return context.logStreamName
}
