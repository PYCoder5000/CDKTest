import { Ec2Stack } from "./ec2";
import { VpcStack } from "./vpc";
import { CicdStack } from "./cicd";
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WebStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);
      const vpcStack = new VpcStack(this, id + "-Vpc", {});
      const ec2Stack = new Ec2Stack(this, id + "-Ec2", {
        vpc: vpcStack.vpc,
        sg: vpcStack.ec2SG,
      })
      const cicdStack = new CicdStack(this, "CICDStack", {});
    }
}