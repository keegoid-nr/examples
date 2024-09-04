# nodejs-sam

## Testing aws-sdk with two layers

- arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS16X:55
- arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS16X:56

With layer version 56 experiencing this error:

```log
2023-11-01 09:59:36.325 {"v":0,"level":20,"name":"newrelic","hostname":"169.254.181.5","pid":15,"time":"2023-11-01T09:59:36.325Z","msg":"Failed to load './package.json' from module root: '/'. Stack: Error: Cannot find module '/package.json'
Require stack:
- /opt/nodejs/node_modules/newrelic/lib/shim/shim.js
- /opt/nodejs/node_modules/newrelic/lib/shim/index.js
- /opt/nodejs/node_modules/newrelic/lib/shimmer.js
- /opt/nodejs/node_modules/newrelic/lib/uninstrumented.js
- /opt/nodejs/node_modules/newrelic/lib/agent.js
- /opt/nodejs/node_modules/newrelic/index.js
- /opt/nodejs/node_modules/newrelic-lambda-wrapper/index.js
- /var/runtime/index.mjs
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1028:15)
    at Function.Module._load (node:internal/modules/cjs/loader:873:27)
    at Module.require (node:internal/modules/cjs/loader:1100:19)
    at Module.Hook._require.Module.require (/opt/nodejs/node_modules/require-in-the-middle/index.js:167:34)
    at require (node:internal/modules/cjs/helpers:119:18)
    at Shim.shimRequire [as require] (/opt/nodejs/node_modules/newrelic/lib/shim/shim.js:1691:12)
    at tryGetVersion (/opt/nodejs/node_modules/newrelic/lib/shimmer.js:717:28)
    at trackInstrumentationUsage (/opt/nodejs/node_modules/newrelic/lib/shimmer.js:695:21)
    at /opt/nodejs/node_modules/newrelic/lib/shimmer.js:543:5
    at Array.forEach (<anonymous>)","component":"Shim","module":"domain"}
```

I'm no longer able to reproduce this error after increasing memory to 256 MiB and the timeout to 20s.
