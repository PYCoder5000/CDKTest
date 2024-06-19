import { Ec2Stack } from "./ec2";
import { VpcStack } from "./vpc";
import { CicdStack } from "./cicd";
import { Route53Stack } from "./route53"
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpcStack = new VpcStack(this, id + "-Vpc", { env: env });
    const ec2Stack = new Ec2Stack(this, id + "-Ec2", {
      env: env,
      vpc: vpcStack.vpc,
      sg: vpcStack.ec2SG,
    })
    const cicdStack = new CicdStack(this, "CICDStack", { env: env });
    const route53Stack = new Route53Stack(this, "Route53Stack", {
      env: env,
      ec2Instance: ec2Stack.instance,
    })
  }
}