from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_route53_targets as targets,
)
from constructs import Construct

class DnsRecordsStack(Stack):
    """
    Stack to create DNS records pointing to CloudFront distribution.
    This stack is separate to avoid circular dependencies between the DNS stack and Website stack.
    """
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        hosted_zone=None, 
        distribution=None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        if hosted_zone and distribution:
            # Create an A record for the root domain (apex)
            route53.ARecord(
                self, "ApexRecord",
                zone=hosted_zone,
                target=route53.RecordTarget.from_alias(
                    targets.CloudFrontTarget(distribution)
                ),
                record_name="makerspace3d.co.za"  # Use full domain name instead of @
            )

            # Create an A record for the www subdomain
            route53.ARecord(
                self, "WwwRecord",
                zone=hosted_zone,
                target=route53.RecordTarget.from_alias(
                    targets.CloudFrontTarget(distribution)
                ),
                record_name="www.makerspace3d.co.za"  # Use full domain with www
            )
