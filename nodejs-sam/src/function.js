// const dns = require('node:dns')
const something = require('aws-sdk')
const axios = require('axios')

console.log("Lambda Handler starting up")

exports.handler = (event, context) => {
  console.log("Hello world!")
  return "success"
}
