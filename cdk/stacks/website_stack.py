from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from constructs import Construct


class WebsiteStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create a unique bucket name for the React app
        bucket_name = "larql-audio-app-website-bucket"

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

        # Create a CloudFront distribution for the website
        distribution = cloudfront.Distribution(
            self, "WebsiteDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(website_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            default_root_object="index.html",
            error_responses=[
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
        )

        # Deploy website content from the dist directory
        s3deploy.BucketDeployment(
            self, "DeployWebsite",
            sources=[s3deploy.Source.asset("./dist")],
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=["/*"],
        )

        # Store the distribution for other stacks to use
        self.distribution = distribution

        # Output CloudFront distribution URL
        CfnOutput(
            self, "DistributionUrl",
            value=distribution.distribution_domain_name,
            description="CloudFront distribution URL",
        )
