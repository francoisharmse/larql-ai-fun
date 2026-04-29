from aws_cdk import (
    Stack,
    RemovalPolicy,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_certificatemanager as acm,
    Duration,
    CfnOutput,
)
from constructs import Construct

class WebsiteStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        dns_registrar_set: bool = False,
        hosted_zone = None,
        domain_name: str = "makerspace3d.co.za",
        **kwargs
    ) -> None:
        # Extract dns_registrar_set before passing to parent constructor
        if 'dns_registrar_set' in kwargs:
            del kwargs['dns_registrar_set']

        super().__init__(scope, construct_id, **kwargs)

        # Use provided domain name
        www_domain_name = f"www.{domain_name}"
        bucket_name = f"{domain_name.replace('.', '-')}-website-bucket"

        # Create an S3 bucket for website hosting
        website_bucket = s3.Bucket(
            self, "WebsiteBucket",
            bucket_name=bucket_name,
            website_index_document="index.html",
            website_error_document="index.html",  # SPA routing
            public_read_access=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ACLS,
            removal_policy=RemovalPolicy.DESTROY,  # For easy cleanup during development
            auto_delete_objects=True,  # For easy cleanup during development
        )

        # 1. Create a ResponseHeadersPolicy
        response_headers_policy = cloudfront.ResponseHeadersPolicy(
            self, "ResponseHeadersPolicy",
            response_headers_policy_name="AllowJSProfiling",
            comment="Set Document-Policy for JS Profiling",
            custom_headers_behavior=cloudfront.ResponseCustomHeadersBehavior(
                custom_headers=[
                    cloudfront.ResponseCustomHeader(
                        header="Document-Policy",
                        value="js-profiling",
                        override=True,
                    )
                ]
            )
        )

        # Create distribution properties
        distribution_props = {
            "default_behavior": cloudfront.BehaviorOptions(
                origin=origins.S3Origin(website_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                response_headers_policy=response_headers_policy,
            ),
            "default_root_object": "index.html",
            "error_responses": [
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(30),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(30),
                ),
            ],
        }

        # Create certificate and configure custom domain only if DNS registrar is set
        certificate = None
        if dns_registrar_set and hosted_zone:
            # Create the certificate in us-east-1 (required for CloudFront)
            certificate = acm.DnsValidatedCertificate(
                self,
                "SiteCertificate",
                domain_name=domain_name,
                subject_alternative_names=[f"*.{domain_name}"],
                hosted_zone=hosted_zone,
                region="us-east-1",  # CloudFront only checks this region for certificates
            )
            certificate.apply_removal_policy(RemovalPolicy.DESTROY)

            # Add certificate and domain names to distribution properties
            distribution_props.update({
                "certificate": certificate,
                "domain_names": [domain_name, www_domain_name],
                "minimum_protocol_version": cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            })

        # Create a CloudFront distribution for the website
        distribution = cloudfront.Distribution(
            self, "WebsiteDistribution",
            **distribution_props
        )

        # Deploy website content from the build directory
        # Note: This assumes the React build output is available at ../makerspace3d-react/build
        s3deploy.BucketDeployment(
            self, "DeployWebsite",
            sources=[s3deploy.Source.asset("../makerspace3d-react/build")],
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=["/*"],
        )
        # Store the distribution for other stacks to use
        self.distribution = distribution
