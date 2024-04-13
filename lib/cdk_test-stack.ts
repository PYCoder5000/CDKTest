import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, SubnetType, Instance, InstanceType, MachineImage, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';

export class CdkTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'MyVPC', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow ssh and HTTP access to ec2 instances',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH access from the Internet');
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP access from the Internet');

    const instance = new Instance(this, 'Instance', {
      vpc,
      instanceType: new InstanceType('t2.micro'),
      machineImage: MachineImage.latestAmazonLinux2023(), 
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      securityGroup: securityGroup,
    });
    const userDataScript = `#!/bin/bash
yum update -y
sudo yum install git -y
sudo yum install python -y
sudo yum install pip -y
sudo pip install flask
git clone https://github.com/ailec0623/TestWebsite.git
sudo chmod +x /TestWebsite/bin/start_server.sh
sudo nohup /TestWebsite/bin/start_server.sh > /tmp/myapp.log 2>&1 &
`;
    instance.addUserData(userDataScript);
  }
}