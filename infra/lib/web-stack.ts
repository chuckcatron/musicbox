import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';
import * as path from 'path';

interface WebStackProps extends cdk.StackProps {
  apiUrl: string;
  userPoolId: string;
  userPoolClientId: string;
}

export class WebStack extends cdk.Stack {
  public readonly distributionUrl: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    // Create S3 bucket for static hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `music-box-web-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Origin Access Control
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      originAccessControlName: 'music-box-oac',
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    this.distributionUrl = `https://${distribution.distributionDomainName}`;
    this.bucketName = websiteBucket.bucketName;

    // Outputs
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: this.distributionUrl,
      description: 'CloudFront Distribution URL',
      exportName: 'MusicBoxDistributionUrl',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: 'MusicBoxDistributionId',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucketName,
      description: 'S3 Bucket Name',
      exportName: 'MusicBoxBucketName',
    });

    // Output environment variables for the frontend build
    new cdk.CfnOutput(this, 'FrontendEnvVars', {
      value: JSON.stringify({
        NEXT_PUBLIC_API_URL: props.apiUrl,
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: props.userPoolId,
        NEXT_PUBLIC_COGNITO_CLIENT_ID: props.userPoolClientId,
        NEXT_PUBLIC_COGNITO_REGION: this.region,
      }),
      description: 'Environment variables for frontend build',
    });
  }
}
