import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType, Instance, InstanceType, MachineImage, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Ec2RoleStack } from './ec2_role'

export interface Ec2Prods extends StackProps {
    readonly vpc: Vpc;
    readonly sg: SecurityGroup;
}

export class Ec2Stack extends Stack {
    public readonly instance: Instance;
    constructor(scope: Construct, id: string, props: Ec2Prods) {
        super(scope, id, props);
        const role_stack = new Ec2RoleStack(this, "EC2_Instance_Role", {});
        this.instance = new Instance(this, 'Instance', {
            vpc: props.vpc,
            instanceType: new InstanceType('t2.micro'),
            machineImage: MachineImage.latestAmazonLinux2023(), 
            role: role_stack.role,
            vpcSubnets: {
              subnetType: SubnetType.PUBLIC,
            },
            securityGroup: props.sg,
          });
          const userDataScript = `#!/bin/bash
sudo yum update -y
sudo yum install -y ruby
sudo yum install -y wget
cd /home/ec2-user
wget https://aws-codedeploy-us-west-2.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl start codedeploy-agent
sudo systemctl enable codedeploy-agent
      `;
          this.instance.addUserData(userDataScript);
          Tags.of(this.instance).add('App', 'website');
    }
}