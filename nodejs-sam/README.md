# nodejs-sam

## Comparing REPORT lines

The following REPORT lines highlight the duration differences between the PR at June 26th and the fixed code.

MemorySize: 256

**Node 16:**

Layer: arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS16X:56

```
| 2023-11-28 21:13:54.406 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs16 | REPORT RequestId: 1424d070-59f5-45f8-90a3-7041eddbaeae Duration: 4466.69 ms Billed Duration: 4467 ms Memory Size: 256 MB Max Memory Used: 115 MB Init Duration: 518.54 ms |
| 2023-11-28 21:13:57.174 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs16 | REPORT RequestId: f8809bd9-2cb3-4586-9b33-cc4d0d5502e2 Duration: 24.48 ms Billed Duration: 25 ms Memory Size: 256 MB Max Memory Used: 115 MB |
| 2023-11-28 21:13:58.994 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs16 | REPORT RequestId: 04425d24-e89b-4c55-84e6-346162fed24e Duration: 37.91 ms Billed Duration: 38 ms Memory Size: 256 MB Max Memory Used: 115 MB |
| 2023-11-28 21:14:00.734 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs16 | REPORT RequestId: 54af509e-4b90-4a93-9d5d-8503dcd16e36 Duration: 5.96 ms Billed Duration: 6 ms Memory Size: 256 MB Max Memory Used: 115 MB |
```

Layer: NewRelicNodeJS16X - fixed

```
| 2023-11-28 21:14:28.220 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs16 | REPORT RequestId: 66eb696c-d2c5-4ee3-9d6a-737b3749d43f Duration: 460.03 ms Billed Duration: 461 ms Memory Size: 256 MB Max Memory Used: 127 MB Init Duration: 1402.05 ms |
| 2023-11-28 21:14:31.491 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs16 | REPORT RequestId: 52e69c7c-fc18-48ba-b3db-0c13334d07c6 Duration: 84.26 ms Billed Duration: 85 ms Memory Size: 256 MB Max Memory Used: 127 MB |
| 2023-11-28 21:14:33.031 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs16 | REPORT RequestId: e2e03f08-b23a-414e-8eba-ec23394197d7 Duration: 88.39 ms Billed Duration: 89 ms Memory Size: 256 MB Max Memory Used: 127 MB |
| 2023-11-28 21:14:34.272 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs16 | REPORT RequestId: 635c2c00-c5c9-4314-8b75-723f0bf21be6 Duration: 21.50 ms Billed Duration: 22 ms Memory Size: 256 MB Max Memory Used: 127 MB |
```

**Node 18:**

Layer: arn:aws:lambda:us-west-2:451483290750:layer:NewRelicNodeJS18X:31

```
| 2023-11-28 21:14:44.577 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs18 | REPORT RequestId: 868fd98d-bbe8-4a9f-b983-8d9639c2928c Duration: 4761.88 ms Billed Duration: 4762 ms Memory Size: 256 MB Max Memory Used: 125 MB Init Duration: 635.90 ms |
| 2023-11-28 21:14:47.492 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs18 | REPORT RequestId: 6ae8b7d4-75a0-4bdd-a4fd-498333fc6738 Duration: 22.93 ms Billed Duration: 23 ms Memory Size: 256 MB Max Memory Used: 125 MB |
| 2023-11-28 21:14:48.613 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs18 | REPORT RequestId: 7cd9154f-7e54-44d9-94bc-2323c65ad536 Duration: 51.39 ms Billed Duration: 52 ms Memory Size: 256 MB Max Memory Used: 125 MB |
| 2023-11-28 21:14:49.894 | 368927449855:/aws/lambda/kmullaney-slow-performance-nodejs18 | REPORT RequestId: 55a8a5c7-88b0-4ee1-a428-89f8717da9d2 Duration: 4.95 ms Billed Duration: 5 ms Memory Size: 256 MB Max Memory Used: 125 MB |
```

Layer: NewRelicNodeJS18X - fixed

```
| 2023-11-28 21:15:07.523 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs18 | REPORT RequestId: 9622c879-ec2b-4e94-b216-59b3f476182a Duration: 422.05 ms Billed Duration: 423 ms Memory Size: 256 MB Max Memory Used: 133 MB Init Duration: 1451.64 ms |
| 2023-11-28 21:15:09.912 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs18 | REPORT RequestId: 9e5a9497-42dc-463e-8afc-005c9b0992a4 Duration: 100.56 ms Billed Duration: 101 ms Memory Size: 256 MB Max Memory Used: 135 MB |
| 2023-11-28 21:15:11.053 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs18 | REPORT RequestId: 197a0bac-290b-482f-afca-fcf258879b9a Duration: 13.90 ms Billed Duration: 14 ms Memory Size: 256 MB Max Memory Used: 135 MB |
| 2023-11-28 21:15:12.252 | 368927449855:/aws/lambda/kmullaney-fast-performance-nodejs18 | REPORT RequestId: 5ecb99c6-661d-4480-9607-ad2cc34221ac Duration: 35.03 ms Billed Duration: 36 ms Memory Size: 256 MB Max Memory Used: 136 MB |
```
