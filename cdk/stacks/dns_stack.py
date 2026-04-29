from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_route53_targets as targets,
)
from constructs import Construct

class DnsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, website_stack=None, dns_registrar_set=False, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create a Route53 hosted zone for makerspace3d
        hosted_zone = route53.PublicHostedZone(
            self, "MakerspaceDnsZone",
            zone_name="makerspace3d.co.za",
            comment="Hosted zone for Makerspace3D website"
        )

        # Create a dummy A record only if DNS registrar is not yet set
        # This will be replaced by the CloudFront record in the DnsRecordsStack
        if not dns_registrar_set:
            route53.ARecord(
                self, "DummyRootRecord",
                zone=hosted_zone,
                target=route53.RecordTarget.from_ip_addresses("169.1.24.244"),
                record_name="makerspace3d.co.za"  # Use full domain name instead of @
            )

        # Store the hosted zone for later use
        self.hosted_zone = hosted_zone
