#!/usr/bin/env python3
import os
import aws_cdk as cdk
from stacks.website_stack import WebsiteStack
from stacks.dns_stack import DnsStack
from stacks.dns_records_stack import DnsRecordsStack

app = cdk.App()

# Get environment variables or use defaults
account = os.environ.get("CDK_DEFAULT_ACCOUNT", "")
region = os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
env = cdk.Environment(account=account, region=region)

# Flag to indicate if DNS registrar has been updated with Route53 nameservers
# Set this to True after updating your domain registrar with the Route53 nameservers
DNS_REGISTRAR_SET = True

# Phase 1: Create the DNS stack with just the hosted zone and dummy record
dns_stack = DnsStack(app, "DnsStack",
    # Stack properties
    env=env,
    description="DNS Infrastructure for Makerspace3D",
    dns_registrar_set=DNS_REGISTRAR_SET
)

# Phase 2: Create the website stack with the hosted zone from DNS stack
website_stack = WebsiteStack(app, "WebsiteStack",
    # Stack properties
    env=env,
    description="Infrastructure for Makerspace3D website",
    dns_registrar_set=DNS_REGISTRAR_SET,
    hosted_zone=dns_stack.hosted_zone
)

# Phase 3: If DNS registrar is set, create a separate stack for CloudFront DNS records
if DNS_REGISTRAR_SET:
    dns_records_stack = DnsRecordsStack(app, "DnsRecordsStack",
        # Stack properties
        env=env,
        description="CloudFront DNS Records for Makerspace3D",
        hosted_zone=dns_stack.hosted_zone,
        distribution=website_stack.distribution
    )
    
    # Make sure the DNS records stack depends on both the DNS stack and Website stack
    dns_records_stack.add_dependency(dns_stack)
    dns_records_stack.add_dependency(website_stack)

app.synth()
