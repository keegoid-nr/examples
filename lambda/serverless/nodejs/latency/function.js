var aws = require("aws-sdk")
var fs = require("fs")


// In a Node Lambda, the runtime loads the handler code as a module; so code in the top level
// of the module occurs once, during cold start.
console.log("Lambda Handler starting up")

module.exports.lambda_handler = async function (event, context) {
  // https://stackoverflow.com/questions/41557956/can-you-trigger-an-aws-lambda-on-a-dynamic-timer
  var cloudwatchevents = new aws.CloudWatchEvents()
  var intervals = Array(1, 2, 3, 4, 5)
  var nextInterval = intervals[Math.floor(Math.random() * intervals.length)]
  // var currentTime = new Date().getTime() // UTC time
  var nextTime = dateAdd(currentTime, "minute", nextInterval)
  // var nextTime = dateAdd(currentTime, "minute", nextInterval)
  // var nextMinutes = nextTime.getMinutes()
  // var nextHours = nextTime.getHours()
  var files = fs.readdirSync("/opt/nodejs/")
  var packageLock = fs.readFileSync("/opt/nodejs/package-lock.json").toString()

  // do work
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  console.warn("Event not processed.")
  console.log(files)
  console.log("***package-lock.json***\n", packageLock)

  // update scheduled event
  var scheduleExpression = "rate(" + nextInterval + " minutes)"
  var params = {
    Name: "random_1-5_minutes",
    ScheduleExpression: scheduleExpression,
  }
  cloudwatchevents.putRule(params, function (err, data) {
    if (err) {
      console.log(err, err.stack)
    } else {
      console.log(data)
    }
  })

  return context.logStreamName
}

// var dateAdd = function (date, interval, units) {
//   var ret = new Date(date) // don't change original date
//   switch (interval.toLowerCase()) {
//     case "year":
//       ret.setFullYear(ret.getFullYear() + units)
//       break
//     case "quarter":
//       ret.setMonth(ret.getMonth() + 3 * units)
//       break
//     case "month":
//       ret.setMonth(ret.getMonth() + units)
//       break
//     case "week":
//       ret.setDate(ret.getDate() + 7 * units)
//       break
//     case "day":
//       ret.setDate(ret.getDate() + units)
//       break
//     case "hour":
//       ret.setTime(ret.getTime() + units * 3600000)
//       break
//     case "minute":
//       ret.setTime(ret.getTime() + units * 60000)
//       break
//     case "second":
//       ret.setTime(ret.getTime() + units * 1000)
//       break
//     default:
//       ret = undefined
//       break
//   }
//   return ret
// }
