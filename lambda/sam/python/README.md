<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [kmullaney-python-39](#kmullaney-python-39)
  - [Setup](#setup)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# kmullaney-python-39

Testing Python 3.9 instrumentation

## Setup

Create a `samconfig.toml` for parameter overrides:

```toml
version = 0.1

[default.deploy.parameters]
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "NRAccountId=1234567"
```
