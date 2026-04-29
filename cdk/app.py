#!/usr/bin/env python3
import os

import aws_cdk as cdk
from stacks.website_stack import WebsiteStack

app = cdk.App()

# Get environment variables or use defaults
account = os.environ.get("CDK_DEFAULT_ACCOUNT", "")
region = os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
env = cdk.Environment(account=account, region=region)


website_stack = WebsiteStack(app, "WebsiteStack",
    # Stack properties
    env=env,
    description="Infrastructure for Makerspace3D website",
)

app.synth()
