import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { ServerApplication, ServerDeploymentGroup, InstanceTagSet } from 'aws-cdk-lib/aws-codedeploy';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';


export interface CicdStackProps extends cdk.StackProps {
  readonly autoScalingGroup: AutoScalingGroup;
}

export class CicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'MyDeploymentBucket', {
      bucketName: "website-cicd-bucket-ruifc",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const application = new ServerApplication(this, 'MyApplication', {
      applicationName: 'WebApp',
    });

    const deploymentGroup = new ServerDeploymentGroup(this, 'MyDeploymentGroup', {
      application,
      deploymentGroupName: 'WebAppDeploymentGroup',
      ec2InstanceTags: new InstanceTagSet({
        "App": ["website"]
      }),
      autoScalingGroups: [props.autoScalingGroup],
      installAgent: true,
    });

    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
